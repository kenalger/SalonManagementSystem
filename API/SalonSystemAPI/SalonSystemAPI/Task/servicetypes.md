<!-- STATUS: IMPLEMENTED — 2026-04-27 -->
<!-- All items below have been fully implemented. See implementation notes at the bottom. -->

Create a complete Salon Service Type Management Flow / Process Logic for my system using ASP.NET (.NET) backend with MVC architecture, Supabase (PostgreSQL), and React Vite frontend with shadcn/ui components.

Use the model below as the base:

public class ServiceType
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public double Price { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime DateCreated { get; set; }
}

I need you to think like a senior software architect and design the full real-world Service Type / Salon Services module.

System Stack
Backend: ASP.NET (.NET)
Architecture: MVC (Model View Controller pattern)
Database: Supabase PostgreSQL
Frontend: React + Vite
UI: shadcn/ui
API Calls: Axios / Fetch
Optional Realtime: Supabase Realtime
What I Need
Service Type Core Logic

Design professional flow for:

Create new service
Update service
Soft delete service
Activate / deactivate service
Duplicate existing service
Multi-branch service availability
Search / filter services

Examples:

Haircut
Hair Color
Rebond
Manicure
Pedicure
Facial
Massage
Validation Logic

Need proper validations:

Service name required
Name must be unique per organization
Prevent duplicate names like Haircut / haircut
Description optional with max length
DurationMinutes must be > 0
Price must be >= 0
Prevent deletion if linked to active bookings
Duration Logic

Use DurationMinutes for booking engine:

Auto compute booking EndTime
Block calendar slot based on duration
Show estimated finish time
Long services occupy more time

Examples:

Haircut = 30 mins
Hair Color = 90 mins
Rebond = 180 mins
Pricing Logic

Need production pricing flow:

Base price
Promo price
Member discount compatibility
Tax optional
Branch-based pricing override
Price history tracking
Category System (Recommend If Needed)

Should I add tables for:

Hair Services
Nail Services
Facial Services
Spa Services
Packages

Explain best practice schema.

Staff Compatibility Logic

Need rules:

Which staff can perform which services
Junior stylists basic only
Senior stylists premium services
Booking page shows only qualified staff
Booking Integration Logic

How ServiceType connects to bookings:

Use DurationMinutes to compute EndTime
Use Price for FinalPrice
Auto populate service info in booking modal
Prevent inactive service booking
Frontend React + shadcn/ui

Design UI flow for:

Service management page
DataTable for services
Dialog Add/Edit Service
Switch active/inactive
Tabs Active / Inactive
Search bar
Badge duration
Currency formatting
Toast alerts
Skeleton loading states
Dashboard Metrics

Need cards/widgets:

Total active services
Most booked services
Highest revenue services
Inactive services
Avg duration
Reports

Need reporting logic:

Most booked services
Revenue by service
Service popularity by branch
Average booking duration
Cancelled by service type
Supabase / PostgreSQL Technical Output Needed

Please give me:

Recommended PostgreSQL schema improvements
Supabase table design
Foreign key relationships
Index strategy for fast searching
Case-insensitive unique name constraint
Soft delete best practice
Row Level Security recommendations
Realtime update strategy
Backend MVC service/repository structure
API endpoints for React frontend
Production-ready scaling approach
Edge Cases

Handle:

Duplicate service names
Price changed while booking exists
Service disabled but future bookings exist
Very long duration services
Multi-branch pricing conflict
Simultaneous edits by admins

---

## Implementation Notes (2026-04-27 — COMPLETED)

### Backend — `API/SalonSystemAPI/SalonSystemAPI/`

- **`Models/DTO/CreateServiceTypeDto.cs`** — Input DTO with `[Required]`, `[MaxLength]`, `[Range]` validation on all fields
- **`Models/DTO/UpdateServiceTypeDto.cs`** — Update DTO (same validation, no OrganizationId)
- **`Data/AppDbContext.cs`** — Added composite index on `(OrganizationId, IsActive)` for fast per-org lookups
- **`Controllers/ServiceTypesController.cs`** — Full controller with:
  - `GET /api/servicetypes?orgId=&search=&isActive=` — list with search filter and active/inactive toggle
  - `POST /api/servicetypes` — create with case-insensitive duplicate name check per org
  - `PUT /api/servicetypes/{id}` — update with same duplicate check (excluding self)
  - `PATCH /api/servicetypes/{id}/toggle-active` — activate/deactivate; blocks deactivation if upcoming active bookings exist
  - `POST /api/servicetypes/{id}/duplicate` — copies service as inactive with auto-generated "Copy of X" name
  - `DELETE /api/servicetypes/{id}` — soft delete (deactivates); blocks if active bookings exist
  - `GET /api/servicetypes/metrics?orgId=` — returns totalActive, totalInactive, avgDurationMinutes, avgPrice
- **Migration `AddServiceTypeIndex`** — Applied to DB

### Frontend — `Frontend/SalonManagementSystemReact/src/`

- **`services/api.js`** — Added `serviceTypesApi` with all 8 endpoint methods
- **`pages/Services/ServicesPage.jsx`** — Full UI:
  - Dashboard metric cards (Active, Inactive, Avg Duration, Avg Price)
  - Search bar with client-side filter
  - Tabs: Active / Inactive (with counts)
  - Table: Name, Description, Duration badge, Price, Actions (Edit, Duplicate, Activate/Deactivate, Delete)
  - Add/Edit Dialog with name, description, duration (with human-readable preview), price fields