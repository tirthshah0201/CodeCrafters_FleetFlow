# ✈️ FleetFlow — Trip Dispatcher & Fleet Operations Platform

> Enterprise-grade SaaS Fleet Management System built for logistics teams, hackathon demos, and ERP integrations.

---

## 🚀 Key Features

* **Real-time Dashboard & Analytics**: Features a real-time dashboard with KPIs, popular route analytics, and fuel efficiency reports.
* **Smart Trip Booking**: Includes comprehensive trip booking with built-in validation rules.
* **Vehicle Capacity Guard**: Automatically blocks trip creation if the cargo weight exceeds the assigned vehicle's capacity limit.
* **Double Booking Prevention**: Prevents double booking by checking if a driver or vehicle is already assigned to an active trip (Scheduled, Dispatched, or In Transit).
* **Trip Lifecycle Management**: Tracks trips through progressive statuses: Scheduled, Dispatched, In Transit, Delivered, Delayed, and Cancelled.
* **Fuel Cost Estimation**: Automatically estimates fuel cost based on distance and cargo weight before the trip begins.
* **Role-Based Access Control (RBAC)**: Secure access tailored for Manager, Dispatcher, and Safety Officer roles.
* **Vehicle Registry**: Manages the fleet by tracking license plates, vehicle models, maximum payload capacities, and odometer readings.
* **Maintenance & Service Logs**: Tracks vehicle issues, repairs, scheduled services, and maintenance costs with "New", "In Progress", or "Completed" statuses.
* **Live Tracking UI**: GPS-ready interface to record and display trip tracking telemetry, including latitude, longitude, and speed.

---

## 🎯 Smart Validation Rules (Backend)

* **Capacity Check**: Throws an `IllegalStateException` if the requested cargo weight exceeds the vehicle's maximum capacity in kilograms.
* **Availability Check**: Blocks assignments if the selected vehicle or driver does not have an 'AVAILABLE' status.
* **Route Validation**: Ensures that the origin city and destination city are not the same.
* **Date Validation**: Validates that the scheduled trip date is set in the future.

---

## 🛠️ Tech Stack

**Frontend**

* Built with HTML5, CSS3, and Vanilla JavaScript (ES6+).
* Styled using CSS Custom Properties for seamless dark/light mode theming and CSS Grid + Flexbox for responsive layouts.
* Typography powered by Google Fonts, including IBM Plex Mono and Sora.

**Backend**

* Powered by Java 17 and Spring Boot 3.x.
* Implements RESTful APIs with controllers like `TripController`.
* Secured using Spring Security, JWT Bearer tokens, and method-level `@PreAuthorize` guards.
* Uses Lombok, MapStruct, and Bean Validation (JSR-380) for streamlined data processing.

**Database**

* Relational data managed with MySQL 8.0+.
* Object-Relational Mapping handled via Spring Data JPA and Hibernate.

---

## 💾 Database Schema Overview

The MySQL database schema is fully normalized and includes the following core tables:

* `users`: Manages authentication and RBAC with BCrypt hashed passwords.
* `vehicles`: Stores fleet registry details including capacity, fuel level, and maintenance status.
* `drivers`: Stores driver registry details, license expiry dates, and performance ratings.
* `trips`: Contains main trip records, scheduling, priorities, and fuel estimates.
* `trip_status_log`: Maintains a full audit trail of all trip status changes.
* `trip_tracking`: Stores time-series GPS coordinates for live telemetry.
* `notifications`: Handles system alerts for delays, dispatches, and maintenance.
* `fuel_logs`: Tracks exact fuel consumption, costs, and prices per litre.

---

## ⚙️ Core API Endpoints

* `POST /api/v1/trips`: Creates a new trip (requires Manager or Dispatcher role).
* `GET /api/v1/trips`: Lists all trips with optional filters for status, priority, vehicle type, and search terms.
* `PATCH /api/v1/trips/{id}/advance`: Advances a trip to its next lifecycle status.
* `DELETE /api/v1/trips/{id}`: Cancels a specific trip (restricted to Manager role only).

---

## 🚀 Quick Start

**Frontend Only (Demo Mode)**

* Navigate to the `frontend` directory.
* Open `index.html` or `maintenance.html` in any modern web browser to view the fully functional UI shells.

**Full Stack Setup**

* Initialize the database by running `mysql -u root -p < database/schema.sql`.
* Navigate to the `backend` directory and start the server using `./mvnw spring-boot:run`.
* In the frontend `app.js`, update the API base URL to `http://localhost:8080` before opening `index.html`.
