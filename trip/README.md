# ✈️ FleetFlow — Trip Dispatcher & Fleet Operations Platform

> Enterprise-grade SaaS Fleet Management System built for logistics teams, hackathon demos, and ERP integrations.

---

## 🚀 Live Features

| Feature | Status |
|---|---|
| Real-time Dashboard with KPIs | ✅ |
| Smart Trip Booking with validation | ✅ |
| Vehicle Capacity Guard (overload block) | ✅ |
| Double Booking Prevention | ✅ |
| Trip Lifecycle (Scheduled → Dispatched → In Transit → Delivered) | ✅ |
| Fuel Cost Estimation | ✅ |
| Role-Based Access (Manager / Dispatcher / Safety Officer) | ✅ |
| Search, Filter, Sort, Export CSV | ✅ |
| Dark / Light Mode | ✅ |
| Vehicle Registry | ✅ |
| Driver Management | ✅ |
| Live Tracking UI (GPS-ready) | ✅ |
| Analytics Dashboard | ✅ |
| Compliance Monitoring | ✅ |
| AI Route Insights | ✅ |
| Responsive / Mobile-first | ✅ |

---

## 📁 Project Structure

```
fleetflow/
├── frontend/
│   ├── index.html          ← Main SPA shell
│   ├── styles.css          ← Complete design system
│   └── app.js              ← Full application logic
│
├── backend/
│   └── src/main/
│       ├── java/com/fleetflow/
│       │   ├── FleetFlowApplication.java
│       │   ├── controller/
│       │   │   └── TripController.java
│       │   ├── service/
│       │   │   └── TripService.java
│       │   ├── model/
│       │   │   └── Trip.java
│       │   ├── repository/
│       │   ├── security/        ← JWT auth
│       │   ├── dto/
│       │   └── config/
│       └── resources/
│           └── application.yml
│
├── database/
│   └── schema.sql              ← Complete MySQL schema + seed data
│
└── README.md
```

---

## 🎯 Smart Validation Rules

### 1. Vehicle Capacity Check
```
if (cargo.weight > vehicle.capacity) {
  → Block trip creation
  → Show: "Vehicle capacity exceeded. Please select a suitable vehicle."
}
```

### 2. Double Booking Prevention
```
if (driver.hasActiveTrip() || vehicle.hasActiveTrip()) {
  → Block trip creation
  → Show: "Driver/Vehicle already assigned to an active trip."
}
```

### 3. Date Validation
```
if (scheduledDate < NOW()) → "Date cannot be in the past"
if (origin == destination) → "Origin and destination must differ"
```

---

## 🚦 Trip Lifecycle

```
SCHEDULED → DISPATCHED → IN TRANSIT → DELIVERED
                                   ↘ DELAYED (can occur at any stage)
                                   ↘ CANCELLED
```

Each transition:
- Updates vehicle/driver status
- Logs timestamp
- Fires notification
- Creates audit entry

---

## 🔒 Role-Based Access Control

| Permission        | Manager | Dispatcher | Safety Officer |
|-------------------|:-------:|:----------:|:--------------:|
| View all trips    | ✅       | ✅          | ✅              |
| Create trip       | ✅       | ✅          | ❌              |
| Dispatch trip     | ✅       | ✅          | ❌              |
| Cancel trip       | ✅       | ❌          | ❌              |
| View compliance   | ✅       | ❌          | ✅              |
| Manage users      | ✅       | ❌          | ❌              |
| View analytics    | ✅       | ✅          | ✅              |

---

## ⚙️ Backend API Endpoints

```
POST   /api/v1/auth/login              Login → returns JWT
POST   /api/v1/auth/register           Register user

GET    /api/v1/trips                   List trips (filter/sort/search)
POST   /api/v1/trips                   Create trip
GET    /api/v1/trips/{id}              Get trip detail
PATCH  /api/v1/trips/{id}/advance      Advance lifecycle status
DELETE /api/v1/trips/{id}              Cancel trip

GET    /api/v1/vehicles                List all vehicles
GET    /api/v1/vehicles/available      Only available vehicles
POST   /api/v1/vehicles                Add vehicle (Manager)

GET    /api/v1/drivers                 List all drivers
GET    /api/v1/drivers/available       Only available drivers

GET    /api/v1/analytics/dashboard     KPI summary
GET    /api/v1/analytics/routes        Popular routes
GET    /api/v1/analytics/fuel          Fuel efficiency report

GET    /api/v1/tracking/{tripId}       Live GPS data
```

---

## 💾 Database Schema (MySQL)

```sql
-- Core tables
users           → Authentication & RBAC
vehicles        → Fleet registry
drivers         → Driver registry
trips           → Main trip records
trip_status_log → Full audit trail
trip_tracking   → GPS coordinates (time-series)
notifications   → Alert system
fuel_logs       → Fuel tracking
```

---

## 🛠️ Tech Stack

**Frontend**
- HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- CSS Custom Properties (full dark/light theming)
- CSS Grid + Flexbox (fully responsive)
- Google Fonts: Syne + Manrope + JetBrains Mono

**Backend**
- Java 17 + Spring Boot 3.x
- Spring Security + JWT (role-based)
- Spring Data JPA + Hibernate
- MySQL 8.0
- Lombok + MapStruct
- Bean Validation (JSR-380)

**Security**
- JWT Bearer tokens
- BCrypt password hashing
- Method-level `@PreAuthorize` guards
- CORS configured

---

## 🚀 Quick Start

### Frontend Only (Demo Mode)
```bash
cd frontend
# Open index.html in any browser
# No server required — fully functional demo
```

### Full Stack
```bash
# 1. Database
mysql -u root -p < database/schema.sql

# 2. Backend
cd backend
./mvnw spring-boot:run

# 3. Frontend
cd frontend
# Update API_BASE_URL in app.js to http://localhost:8080
open index.html
```

### Docker (Coming Soon)
```bash
docker-compose up -d
```

---

## 🏆 Hackathon Highlights

- **AI Route Intelligence** — rotating insight banner with smart suggestions
- **Real-time telemetry UI** — tracking page with progress, speed, location
- **Smart fuel estimator** — cost calc based on route distance × cargo
- **Conflict prevention engine** — two-layer double-booking guard
- **Export to CSV** — one-click data export
- **Full RBAC demo** — three roles with different UI permissions
- **Dark/Light mode** — enterprise-quality theme system
- **Lifecycle visualizer** — step-by-step trip progress tracker
- **Responsive mobile layout** — works on phones and tablets

---

## 📞 API Authentication

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "manager@fleetflow.io",
  "password": "Fleet@2024"
}

→ Response: { "token": "eyJhbGci..." }

# Use in all subsequent requests:
Authorization: Bearer eyJhbGci...
```

---

*Built with ❤️ for FleetFlow — Powering Intelligent Logistics*
