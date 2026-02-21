-- ══════════════════════════════════════════════════════════════
-- FleetFlow Database Schema
-- MySQL 8.0+
-- ══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS fleetflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleetflow;

-- ── USERS ──────────────────────────────────────────────────────
CREATE TABLE users (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,   -- BCrypt hashed
    full_name   VARCHAR(100) NOT NULL,
    role        ENUM('MANAGER','DISPATCHER','SAFETY_OFFICER') NOT NULL DEFAULT 'DISPATCHER',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── VEHICLES ───────────────────────────────────────────────────
CREATE TABLE vehicles (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_code    VARCHAR(20) UNIQUE NOT NULL,   -- e.g. TRK-001
    vehicle_type    ENUM('TRUCK','VAN','BUS','TRAILER') NOT NULL,
    plate_number    VARCHAR(20) UNIQUE NOT NULL,
    capacity_kg     DECIMAL(10,2) NOT NULL,        -- max cargo weight in kg
    fuel_level      DECIMAL(5,2) NOT NULL DEFAULT 100.00,  -- %
    mileage_km      DECIMAL(10,2) NOT NULL DEFAULT 0,
    manufacture_year SMALLINT,
    status          ENUM('AVAILABLE','ON_TRIP','MAINTENANCE','RETIRED') NOT NULL DEFAULT 'AVAILABLE',
    last_service_at TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_fuel_range CHECK (fuel_level BETWEEN 0 AND 100)
);

-- ── DRIVERS ────────────────────────────────────────────────────
CREATE TABLE drivers (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_code   VARCHAR(20) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    license_number  VARCHAR(30) UNIQUE NOT NULL,
    license_expiry  DATE NOT NULL,
    phone           VARCHAR(15),
    rating          DECIMAL(3,2) DEFAULT 5.00,
    total_trips     INT DEFAULT 0,
    experience_yrs  TINYINT DEFAULT 0,
    status          ENUM('AVAILABLE','ON_TRIP','OFF_DUTY','SUSPENDED') NOT NULL DEFAULT 'AVAILABLE',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1.0 AND 5.0)
);

-- ── TRIPS ──────────────────────────────────────────────────────
CREATE TABLE trips (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    trip_code           VARCHAR(20) UNIQUE NOT NULL,   -- e.g. TRP-001
    vehicle_id          BIGINT NOT NULL,
    driver_id           BIGINT NOT NULL,
    created_by          BIGINT NOT NULL,               -- user who created

    origin_city         VARCHAR(100) NOT NULL,
    destination_city    VARCHAR(100) NOT NULL,
    distance_km         DECIMAL(8,2) NULL,

    cargo_weight_kg     DECIMAL(10,2) NOT NULL,
    cargo_type          VARCHAR(50) DEFAULT 'General',
    special_instructions TEXT,

    status              ENUM('SCHEDULED','DISPATCHED','IN_TRANSIT','DELIVERED','CANCELLED','DELAYED')
                        NOT NULL DEFAULT 'SCHEDULED',
    priority            ENUM('NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',

    scheduled_at        DATETIME NOT NULL,
    dispatched_at       DATETIME NULL,
    arrived_at          DATETIME NULL,
    delivered_at        DATETIME NULL,

    estimated_fuel_cost DECIMAL(10,2) NULL,
    actual_fuel_cost    DECIMAL(10,2) NULL,
    fuel_litres         DECIMAL(8,2) NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id)  REFERENCES drivers(id)  ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE RESTRICT,

    INDEX idx_status       (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_vehicle_id   (vehicle_id),
    INDEX idx_driver_id    (driver_id)
);

-- ── TRIP STATUS LOG (audit trail) ─────────────────────────────
CREATE TABLE trip_status_log (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    trip_id     BIGINT NOT NULL,
    old_status  VARCHAR(20),
    new_status  VARCHAR(20) NOT NULL,
    changed_by  BIGINT NOT NULL,
    notes       TEXT,
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id)   REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by)REFERENCES users(id) ON DELETE RESTRICT
);

-- ── LIVE TRACKING ──────────────────────────────────────────────
CREATE TABLE trip_tracking (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    trip_id     BIGINT NOT NULL,
    latitude    DECIMAL(10,7) NOT NULL,
    longitude   DECIMAL(10,7) NOT NULL,
    speed_kmh   DECIMAL(6,2) DEFAULT 0,
    fuel_pct    DECIMAL(5,2) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    INDEX idx_trip_time (trip_id, recorded_at)
);

-- ── NOTIFICATIONS ──────────────────────────────────────────────
CREATE TABLE notifications (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    trip_id     BIGINT NULL,
    type        ENUM('DELAY','DISPATCH','DELIVERED','MAINTENANCE','SYSTEM') NOT NULL,
    title       VARCHAR(200) NOT NULL,
    message     TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id)  ON DELETE SET NULL
);

-- ── FUEL LOGS ──────────────────────────────────────────────────
CREATE TABLE fuel_logs (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id  BIGINT NOT NULL,
    trip_id     BIGINT NULL,
    litres      DECIMAL(8,2) NOT NULL,
    cost_inr    DECIMAL(10,2) NOT NULL,
    price_per_litre DECIMAL(6,2) NOT NULL,
    logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id)    REFERENCES trips(id)    ON DELETE SET NULL
);

-- ── SEED DATA ──────────────────────────────────────────────────
INSERT INTO users (username, email, password, full_name, role) VALUES
('alex_manager', 'manager@fleetflow.io', '$2b$10$hashed...', 'Alex Manager', 'MANAGER'),
('dana_dispatch', 'dispatcher@fleetflow.io', '$2b$10$hashed...', 'Dana Dispatch', 'DISPATCHER'),
('sam_safety', 'safety@fleetflow.io', '$2b$10$hashed...', 'Sam Safety', 'SAFETY_OFFICER');

INSERT INTO vehicles (vehicle_code, vehicle_type, plate_number, capacity_kg, fuel_level, mileage_km, manufacture_year, status) VALUES
('TRK-001', 'TRUCK', 'GJ-01-AB-1234', 15000.00, 78.0, 82400, 2021, 'AVAILABLE'),
('TRK-047', 'TRUCK', 'GJ-05-CD-5678', 12000.00, 52.0, 124300, 2020, 'ON_TRIP'),
('VAN-012', 'VAN',   'GJ-07-EF-9012', 3000.00,  91.0, 41200, 2022, 'AVAILABLE'),
('BUS-003', 'BUS',   'GJ-03-GH-3456', 5000.00,  34.0, 193000, 2019, 'MAINTENANCE'),
('TRK-088', 'TRUCK', 'GJ-09-IJ-7890', 18000.00, 67.0, 67800, 2022, 'ON_TRIP'),
('VAN-031', 'VAN',   'GJ-11-KL-2345', 2500.00,  85.0, 18900, 2023, 'AVAILABLE'),
('TRK-055', 'TRUCK', 'GJ-02-MN-6789', 20000.00, 44.0, 95600, 2021, 'AVAILABLE'),
('VAN-008', 'VAN',   'GJ-06-OP-0123', 2800.00,  60.0, 88200, 2020, 'ON_TRIP');

INSERT INTO drivers (employee_code, full_name, license_number, license_expiry, rating, total_trips, experience_yrs, status) VALUES
('DR-001', 'John Doe',    'GJ-LD-12345', '2027-06-30', 4.80, 247, 7, 'AVAILABLE'),
('DR-002', 'Maria Chen',  'GJ-LD-23456', '2028-03-15', 4.90, 312, 9, 'ON_TRIP'),
('DR-003', 'Raj Patel',   'GJ-LD-34567', '2026-09-20', 4.70, 198, 5, 'AVAILABLE'),
('DR-004', 'Luis Torres', 'GJ-LD-45678', '2027-12-01', 4.60, 156, 4, 'AVAILABLE'),
('DR-005', 'Kim Brown',   'GJ-LD-56789', '2029-04-10', 4.90, 389, 11, 'ON_TRIP'),
('DR-006', 'Anita Shah',  'GJ-LD-67890', '2027-08-22', 4.80, 223, 6, 'AVAILABLE'),
('DR-007', 'Dev Kumar',   'GJ-LD-78901', '2026-11-15', 4.50, 134, 3, 'AVAILABLE'),
('DR-008', 'Sara Mehta',  'GJ-LD-89012', '2028-02-28', 4.70, 178, 5, 'ON_TRIP');
