package com.fleetflow.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Trip {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_code", unique = true, nullable = false, length = 20)
    private String tripCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "origin_city",      nullable = false, length = 100)
    private String originCity;

    @Column(name = "destination_city", nullable = false, length = 100)
    private String destinationCity;

    @Column(name = "distance_km", precision = 8, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "cargo_weight_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal cargoWeightKg;

    @Column(name = "cargo_type", length = 50)
    private String cargoType;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripStatus status = TripStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripPriority priority = TripPriority.NORMAL;

    @Column(name = "scheduled_at",  nullable = false) private LocalDateTime scheduledAt;
    @Column(name = "dispatched_at")                   private LocalDateTime dispatchedAt;
    @Column(name = "arrived_at")                      private LocalDateTime arrivedAt;
    @Column(name = "delivered_at")                    private LocalDateTime deliveredAt;

    @Column(name = "estimated_fuel_cost", precision = 10, scale = 2)
    private BigDecimal estimatedFuelCost;

    @Column(name = "actual_fuel_cost", precision = 10, scale = 2)
    private BigDecimal actualFuelCost;

    @Column(name = "fuel_litres", precision = 8, scale = 2)
    private BigDecimal fuelLitres;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TripStatus   { SCHEDULED, DISPATCHED, IN_TRANSIT, DELIVERED, CANCELLED, DELAYED }
    public enum TripPriority { NORMAL, HIGH, URGENT }
}
