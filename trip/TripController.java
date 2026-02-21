package com.fleetflow.controller;

import com.fleetflow.dto.ApiResponse;
import com.fleetflow.dto.TripCreateRequest;
import com.fleetflow.dto.TripResponse;
import com.fleetflow.security.UserPrincipal;
import com.fleetflow.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TripController {

    private final TripService tripService;

    // GET /api/v1/trips
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','DISPATCHER','SAFETY_OFFICER')")
    public ResponseEntity<ApiResponse<List<TripResponse>>> getAllTrips(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String vehicleType,
            @RequestParam(required = false) String search) {

        List<TripResponse> trips = (status != null || priority != null || vehicleType != null || search != null)
            ? tripService.filterTrips(status, priority, vehicleType, search)
            : tripService.getAllTrips();

        return ResponseEntity.ok(ApiResponse.success(trips));
    }

    // GET /api/v1/trips/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','DISPATCHER','SAFETY_OFFICER')")
    public ResponseEntity<ApiResponse<TripResponse>> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getById(id)));
    }

    // POST /api/v1/trips
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','DISPATCHER')")
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            @Valid @RequestBody TripCreateRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        TripResponse created = tripService.createTrip(req, user.getId());
        return ResponseEntity.status(201).body(ApiResponse.success(created, "Trip created successfully"));
    }

    // PATCH /api/v1/trips/{id}/advance
    @PatchMapping("/{id}/advance")
    @PreAuthorize("hasAnyRole('MANAGER','DISPATCHER')")
    public ResponseEntity<ApiResponse<TripResponse>> advanceStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(tripService.advanceStatus(id, user.getId()), "Status updated"));
    }

    // DELETE /api/v1/trips/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> cancelTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        tripService.cancelTrip(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Trip cancelled"));
    }
}

// ── VEHICLE CONTROLLER ──────────────────────────────────────────
// VehicleController.java
/*
@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    @GetMapping                // List all vehicles
    @GetMapping("/available")  // Only available vehicles
    @GetMapping("/{id}")       // Get one vehicle
    @PostMapping               // Add vehicle (MANAGER only)
    @PutMapping("/{id}")       // Update vehicle
    @PatchMapping("/{id}/status") // Update status
}

// ── DRIVER CONTROLLER ───────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {
    @GetMapping                // List all drivers
    @GetMapping("/available")  // Only available drivers
    @GetMapping("/{id}")       // Driver + compliance info
    @PostMapping               // Add driver (MANAGER only)
    @PutMapping("/{id}")       // Update driver
}

// ── AUTH CONTROLLER ─────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    @PostMapping("/login")    // Returns JWT
    @PostMapping("/register") // Register user
    @PostMapping("/refresh")  // Refresh JWT
    @GetMapping("/me")        // Get current user
}
*/
