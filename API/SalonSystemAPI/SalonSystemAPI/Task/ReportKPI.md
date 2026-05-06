Create a complete Staff Type Quota / Performance Report Module for my salon management system using the exact StaffType model below.

Use This Existing Model

StaffQuota.cs
StaffType.cs

Important Existing Role Structure
Primary Role
User = default account
Admin = management
SuperAdmin = full control
Secondary Role = StaffType Table

This StaffType table is the staff classification of a user.

Examples:

User + Stylist
User + Barber
User + Receptionist
User + Therapist
User + Cashier
User + Staff

Quota/report system must use this StaffType table.

Exclusion Rule

If Primary Role is:

Admin ❌ exclude
SuperAdmin ❌ exclude

Only:

Primary Role = User (Staff) ✅

can be included in quota reports.

System Stack
Backend: ASP.NET (.NET)
Architecture: MVC
Database: Supabase PostgreSQL
Frontend: React + Vite
UI: shadcn/ui
What I Need You To Design
Core Quota / KPI Logic

Build a professional reporting system using StaffType.Name.

Receptionist KPIs
Total bookings created
Walk-in conversions
Membership signups
Customer retention bookings
Stylist / Barber KPIs
Service sales
Clients served
Upsell success
Rebooking %
Therapist KPIs
Sessions completed
Package sales
Repeat customer rate
Cashier KPIs
Transactions handled
Add-on product sales
Checkout speed
Staff KPIs
Attendance
Task completion
Support contribution
Quota Rules

Need logic for:

Only active StaffType records included
Only users with PrimaryRole = User
If promoted to Admin → quota disabled
If StaffType inactive → remove from quota selection
One user should only have one active StaffType
Prevent duplicate StaffType assignment
Dashboard Needed

Need widgets/cards for:

Total quota staff
Top performer
Lowest performer
Completion %
Users achieved quota
Users behind target
Branch ranking
KPI by StaffType
Report Table

Need columns:

User Name
Staff Type Name
Branch
KPI Type
Target
Current Progress
Remaining
Completion %
Rank
Status
React Frontend (shadcn/ui)

Need page for:

Select Branch
Select Staff Type
Select User
Assign quota
Monthly report tabs
KPI filters
Progress bars
DataTable
Dialog
Badge
Cards
Export CSV/PDF
Backend Needed

Need architecture for:

Models
Controllers

Need APIs:

Get eligible staff users
Get active staff types
Assign quota
Update quota
Disable quota
Get KPI report
Get top performers
Get branch rankings
Database Design (Supabase)

Use existing StaffType table and recommend additional tables:

UserQuota
UserQuotaProgress
KPIHistory
StaffTypeHistory

Need foreign keys + indexes.

Calculations Needed

Need formulas for:

Completion %
Remaining target
Rank by branch
Rank by StaffType
Monthly trends
Edge Cases

Handle:

User has inactive StaffType
Duplicate StaffType rows
User changed StaffType mid-month
User resigned
User promoted to Admin
No sales data
Staff transferred branch
Output Format I Want

Please give:

Recommended schema improvements for StaffType
MVC backend architecture
API endpoints
React frontend flow
Supabase SQL queries
KPI formulas
Best practices for staff quotas
Production-ready scalable solution

Use real enterprise salon KPI systems.