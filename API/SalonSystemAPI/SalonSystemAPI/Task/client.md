Build a simple Client / Membership Management module for my Salon Management System using clean, scalable, production-ready code. Keep the UI simple, modern, and easy to use.

System Context

This is for a salon booking system where clients can either:

Be regular walk-in clients
Be registered members with membership discounts

The system must support both scenarios smoothly.

Main Goal

Create a client system where staff can add clients, use clients during appointment creation, and optionally request membership discounts.

Core Client Logic
Client Types
1. Walk-in Client

A client who is not registered as a member.

During appointment creation, staff can manually type the client name.

Example:

Jane Doe
Walk-in Customer
New Client

This is why a free type input is needed.

2. Member Client

A registered salon client saved in the system.

During appointment creation, user can select the client from dropdown/search select.

Example:

Select Existing Member
Appointment Creation Requirement

When creating an appointment, provide two options:

Option A: Free Type Input

For walk-ins or non-members.

Fields:

Client Name
Option B: Select Existing Member

Dropdown / searchable select list of saved clients.

When selected:

Auto load membership status
Auto load approved discount (if any)
Membership Discount Logic

Membership discount is optional.

A client may have:

No discount
5%
10%
15%
Fixed amount discount
Important Approval Flow

Only Owner Role can approve membership discounts.

When Staff Creates Client

If staff adds a client and enters a membership discount:

Status should be:

Pending Approval

Discount must NOT apply yet.

Store request in database.

Example:

Client Name: Maria Santos
Requested Discount: 10%
Status: Pending

Owner Role Permissions

Owner can view pending membership discount requests.

Owner actions:

Approve
Reject
Modify Discount

If approved:

Save approved discount into client record
Mark membership as active
Discount becomes usable in appointments
Client Data Structure

Each client should contain:

Client Id
Full Name
Contact Number
Email (optional)
Membership Status (Regular / Member)
Discount Type (Percent / Fixed)
Discount Value
Approval Status
Approved By
Date Approved
Date Created
Is Active
Appointment Behavior

When member client is selected:

System auto shows:

Member Badge
Discount %
Final Computed Price

Example:

Service = ₱1,000
Discount = 10%
Total = ₱900

If Pending Client is Selected

Show:

“Membership discount pending owner approval”

No discount applied.

Roles & Permissions
Staff

Can:

Add clients
Create appointments
Request membership discount

Cannot:

Approve discounts
Owner

Can:

Add clients
Approve / reject discount requests
Modify membership discounts
Full access
UI Requirements

Keep it simple and clean.

Client Form

Fields:

Name
Contact
Membership checkbox
Optional Discount Input
Save Button

If discount entered:
Show “Pending owner approval”

Appointment Form

Client Section:

( ) Walk-in Client
( ) Select Member Client

If walk-in:
Show text input

If member:
Show searchable dropdown

Membership Approval Page (Owner)

Table:

Client Name
Requested Discount
Requested By
Date Requested
Status
Approve Button
Reject Button
Backend Logic

Use proper architecture.

Create:

Client Model
Membership Approval Model
Appointment Integration

Use clean APIs and reusable methods.

Expected Deliverables

Provide complete implementation for:

Client Management
Membership Discount Approval Flow
Appointment Client Selection Logic
Walk-in Support
Owner Approval Module
Discount Auto Computation
Role Permissions
Clean Database Design
Important

Keep the workflow simple, realistic, and easy for salon staff to use daily.

Do not overcomplicate the process. Build it like a real salon system.