package com.fleetflow.service;

import com.fleetflow.dto.TripCreateRequest;
import com.fleetflow.dto.TripResponse;
import com.fleetflow.model.Driver;
import com.fleetflow.model.Trip;
import com.fleetflow.model.Trip.TripStatus;
import com.fleetflow.model.Vehicle;
import com.fleetflow.repository.DriverRepository;
import com.fleetflow.repository.TripRepository;
import com.fleetflow.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository     tripRepository;
    private final VehicleRepository  vehicleRepository;
    private final DriverRepository   driverRepository;
    private final FuelEstimationService fuelService;

    private static final BigDecimal FUEL_PRICE_PER_LITRE = BigDecimal.valueOf(95); // ₹

    // ── CREATE TRIP ─────────────────────────────────────────────────
    @Transactional
    public TripResponse createTrip(TripCreateRequest req, Long userId) {

        // 1. Load & validate vehicle
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + req.getVehicleId()));

        if (vehicle.getStatus() != Vehicle.VehicleStatus.AVAILABLE)
            throw new IllegalStateException("Vehicle " + vehicle.getVehicleCode() + " is not available (status: " + vehicle.getStatus() + ")");

        // 2. Capacity validation
        if (req.getCargoWeightKg().compareTo(vehicle.getCapacityKg()) > 0) {
            throw new IllegalStateException(
                String.format("Vehicle capacity exceeded! Cargo %.0f kg > Vehicle capacity %.0f kg. Please select a suitable vehicle.",
                    req.getCargoWeightKg().doubleValue(), vehicle.getCapacityKg().doubleValue())
            );
        }

        // 3. Load & validate driver
        Driver driver = driverRepository.findById(req.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + req.getDriverId()));

        if (driver.getStatus() != Driver.DriverStatus.AVAILABLE)
            throw new IllegalStateException("Driver " + driver.getFullName() + " is not available (status: " + driver.getStatus() + ")");

        // 4. Double-booking prevention
        boolean driverDoubleBooked = tripRepository.existsByDriverIdAndStatusIn(
            driver.getId(),
            List.of(TripStatus.SCHEDULED, TripStatus.DISPATCHED, TripStatus.IN_TRANSIT)
        );
        if (driverDoubleBooked)
            throw new IllegalStateException("Driver " + driver.getFullName() + " is already assigned to an active trip. Double booking prevented.");

        boolean vehicleDoubleBooked = tripRepository.existsByVehicleIdAndStatusIn(
            vehicle.getId(),
            List.of(TripStatus.SCHEDULED, TripStatus.DISPATCHED, TripStatus.IN_TRANSIT)
        );
        if (vehicleDoubleBooked)
            throw new IllegalStateException("Vehicle " + vehicle.getVehicleCode() + " is already assigned to an active trip.");

        // 5. Validate origin != destination
        if (req.getOriginCity().equalsIgnoreCase(req.getDestinationCity()))
            throw new IllegalArgumentException("Origin and destination cities must be different.");

        // 6. Validate scheduled date is future
        if (req.getScheduledAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("Scheduled date must be in the future.");

        // 7. Fuel estimation
        BigDecimal distKm = fuelService.estimateDistance(req.getOriginCity(), req.getDestinationCity());
        BigDecimal litres  = fuelService.estimateFuel(distKm, req.getCargoWeightKg());
        BigDecimal fuelCost = litres.multiply(FUEL_PRICE_PER_LITRE).setScale(2, RoundingMode.HALF_UP);

        // 8. Build trip
        Trip trip = Trip.builder()
                .tripCode(generateTripCode())
                .vehicle(vehicle)
                .driver(driver)
                .originCity(req.getOriginCity())
                .destinationCity(req.getDestinationCity())
                .distanceKm(distKm)
                .cargoWeightKg(req.getCargoWeightKg())
                .cargoType(req.getCargoType())
                .specialInstructions(req.getSpecialInstructions())
                .status(TripStatus.SCHEDULED)
                .priority(req.getPriority())
                .scheduledAt(req.getScheduledAt())
                .estimatedFuelCost(fuelCost)
                .fuelLitres(litres)
                .build();

        Trip saved = tripRepository.save(trip);

        // 9. Lock vehicle & driver
        vehicle.setStatus(Vehicle.VehicleStatus.ON_TRIP);
        driver.setStatus(Driver.DriverStatus.ON_TRIP);
        vehicleRepository.save(vehicle);
        driverRepository.save(driver);

        log.info("Trip {} created: {} → {}", saved.getTripCode(), req.getOriginCity(), req.getDestinationCity());
        return TripResponse.from(saved);
    }

    // ── ADVANCE STATUS ──────────────────────────────────────────────
    @Transactional
    public TripResponse advanceStatus(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + tripId));

        TripStatus next = nextStatus(trip.getStatus());
        if (next == null)
            throw new IllegalStateException("Trip is already in final state: " + trip.getStatus());

        trip.setStatus(next);
        setStatusTimestamp(trip, next);

        // When delivered — free vehicle & driver
        if (next == TripStatus.DELIVERED) {
            trip.getVehicle().setStatus(Vehicle.VehicleStatus.AVAILABLE);
            trip.getDriver().setStatus(Driver.DriverStatus.AVAILABLE);
            trip.getDriver().setTotalTrips(trip.getDriver().getTotalTrips() + 1);
            vehicleRepository.save(trip.getVehicle());
            driverRepository.save(trip.getDriver());
        }

        return TripResponse.from(tripRepository.save(trip));
    }

    // ── GET ALL TRIPS ───────────────────────────────────────────────
    public List<TripResponse> getAllTrips() {
        return tripRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(TripResponse::from).toList();
    }

    // ── FILTER TRIPS ────────────────────────────────────────────────
    public List<TripResponse> filterTrips(String status, String priority, String vehicleType, String search) {
        return tripRepository.findWithFilters(status, priority, vehicleType, search)
                .stream().map(TripResponse::from).toList();
    }

    // ── HELPERS ─────────────────────────────────────────────────────
    private static final List<TripStatus> LIFECYCLE =
        List.of(TripStatus.SCHEDULED, TripStatus.DISPATCHED, TripStatus.IN_TRANSIT, TripStatus.DELIVERED);

    private TripStatus nextStatus(TripStatus current) {
        int idx = LIFECYCLE.indexOf(current);
        return (idx >= 0 && idx < LIFECYCLE.size() - 1) ? LIFECYCLE.get(idx + 1) : null;
    }

    private void setStatusTimestamp(Trip trip, TripStatus status) {
        LocalDateTime now = LocalDateTime.now();
        switch (status) {
            case DISPATCHED  -> trip.setDispatchedAt(now);
            case IN_TRANSIT  -> trip.setArrivedAt(now);
            case DELIVERED   -> trip.setDeliveredAt(now);
        }
    }

    private String generateTripCode() {
        long count = tripRepository.count() + 1;
        return String.format("TRP-%03d", count);
    }
}
