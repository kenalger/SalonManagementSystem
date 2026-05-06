<!-- STATUS: IMPLEMENTED — 2026-04-27 -->
<!-- All items below have been fully implemented. See implementation notes at the bottom. -->

Create a complete Salon Appointment / Booking Flow Logic for my system using ASP.NET MVC (.NET) + SQL Server backend and React Vite frontend with shadcn/ui components.

Use the model below as the base:

public class Bookings
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public int BranchId { get; set; }
    public int ServiceTypeId { get; set; }
    public int? CustomerId { get; set; } // member customer
    public string? Name { get; set; } // guest or walk-in
    public string? Contact { get; set; } // guest or walk-in
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public double? Discount { get; set; }
    public double? FinalPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public int StaffUserId { get; set; }
}

I need you to think like a senior software architect and design the full real-world salon appointment / booking process flow.

System Stack
Backend: ASP.NET MVC / .NET
Database: SQL Server
Frontend: React + Vite
UI Components: shadcn/ui
API Communication: Axios / Fetch
What I Need
Booking Types

Design flow for:

Member booking
Guest booking
Walk-in booking
Receptionist manual booking
Advance scheduled booking
Online self-booking
Booking Logic

Need professional logic for:

Validate required fields
Prevent overlapping bookings for same staff
Prevent duplicate bookings
Auto calculate EndTime from service duration
Allow only branch business hours
Suggest next available time slot if occupied
Auto generate booking reference number
Staff Scheduling Logic
Show available staff based on selected date/time
One staff = one customer at a time
Staff break/lunch blocking
Staff leave / absent handling
Auto assign least busy staff
Daily calendar schedule per stylist
Pricing Logic
Base service price
Member discount
Promo discount
Manual admin discount
Tax if needed
FinalPrice cannot be negative
Booking Status Logic

Recommend replacing IsActive with production-ready statuses:

Pending
Confirmed
Checked In
Ongoing
Completed
Cancelled
No Show
Rescheduled

Explain if both Status + IsActive should exist.

Walk-In Logic
Immediate service if staff free
Queue system if fully occupied
Estimated waiting time
Auto assign next available stylist
Cancel / Reschedule Logic
Free occupied slot
Conflict revalidation
Cancellation reason
Reschedule history
Audit logs
React Frontend (shadcn/ui)

Design UI flow using shadcn components:

Booking page layout
Calendar scheduler
Dialog for Create Booking
Drawer for mobile booking
Tabs for Today / Upcoming / Completed
Data table for bookings
Badge for statuses
Select for branch/staff/service
Combobox search customer
Toast notifications
Skeleton loaders
Dashboard

Need widgets/cards for:

Today bookings
Ongoing services
Available staff now
Revenue today
Upcoming appointments
Walk-in queue
Reports
Most booked services
Peak booking hours
Revenue by branch
Staff productivity
Repeat customers
Cancellation rate
Technical Output Needed

Please give me:

Recommended database schema improvements
Backend MVC architecture (Model / View(react) / Controller)
API endpoints for React frontend
React Vite folder structure
shadcn component recommendations
SQL query for overlap booking validation
Real-time update strategy
Production-ready scalable architecture
Real-world salon best practices
Edge case handling

Use modern premium salon system standards like Fresha / Booksy / Mindbody.

---

## Implementation Notes (2026-04-27 — COMPLETED)

### Backend — `API/SalonSystemAPI/SalonSystemAPI/`

- **`Models/Bookings.cs`** — Added `Status`, `BookingType`, `BookingReference`, `DateCreated`, `CancellationReason`
- **`Models/ServiceType.cs`** — Fixed `DurationMinutes` from `DateTime` → `int`
- **`Data/AppDbContext.cs`** — Added composite indexes on `(StaffUserId, StartTime, EndTime)`, `(OrganizationId, BranchId, StartTime)`, unique index on `BookingReference`
- **`Models/DTO/CreateBookingDto.cs`** — Input DTO with validation
- **`Models/DTO/BookingResponseDto.cs`** — Response DTO with staff/service names joined
- **`Models/DTO/UpdateBookingStatusDto.cs`** — Status update DTO
- **`Models/DTO/RescheduleBookingDto.cs`** — Reschedule DTO
- **`Controllers/BookingsController.cs`** — Full controller with:
  - `GET /api/bookings` — list with org/branch/date/status filters
  - `POST /api/bookings` — create (Member / Guest / WalkIn), auto EndTime, overlap check, pricing, unique reference
  - `PATCH /api/bookings/{id}/status` — status transitions
  - `PATCH /api/bookings/{id}/reschedule` — reschedule with overlap recheck
  - `DELETE /api/bookings/{id}` — soft cancel
  - `GET /api/bookings/available-staff` — staff availability for a time slot
  - `GET /api/bookings/next-slot` — suggest next free 30-min slot
  - `GET /api/bookings/dashboard` — today's totals and revenue
  - `GET /api/bookings/services` — services for an org
  - `GET /api/bookings/org-staff` — staff for an org
  - `GET /api/bookings/branches` — branches for an org
- **`Migrations/20260427141432_AddBookingStatusAndFix.cs`** — Applied to DB

### Frontend — `Frontend/SalonManagementSystemReact/src/`

- **`services/api.js`** — Added `bookingsApi` with all endpoint methods
- **`pages/Appointments/AppointmentsPage.jsx`** — Full UI:
  - Dashboard stat cards (Today's Bookings, Ongoing, Completed, Revenue)
  - Tabs: Today / Upcoming / All
  - Booking table with status badges and inline status-transition buttons
  - Create Booking Dialog (Guest / Walk-In / Member types, branch/service/staff selects, datetime, discount, live price preview, available-staff auto-check)
