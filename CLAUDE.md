# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack multi-tenant salon management system with a .NET 10 ASP.NET Core API backend and a React + Vite frontend.

## Commands

### Backend API
```bash
cd API/SalonSystemAPI/SalonSystemAPI
dotnet build                                         # Build
dotnet run                                           # Run (https://localhost:7014)
dotnet ef migrations add <MigrationName>             # Add EF Core migration
dotnet ef database update                            # Apply migrations
```

### Frontend
```bash
cd Frontend/SalonManagementSystemReact
npm install
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

There are no automated tests in this project.

## Architecture

### Backend (`API/SalonSystemAPI/SalonSystemAPI/`)

ASP.NET Core 10 Web API using **Entity Framework Core** with a **PostgreSQL** database hosted on Supabase.

**Key files:**
- `Program.cs` — DI registration, middleware pipeline, CORS, rate limiting, JWT auth
- `AppDbContext.cs` — EF Core context with all entity configurations
- `appsettings.json` — DB connection string, JWT settings (Key/Issuer/Audience/ExpiryHours)
- `Migrations/` — EF Core migration history

**Controllers and their roles:**
- `AuthController` (`/api/auth`) — Login, returns JWT
- `UsersController` (`/api/users`) — Self-registration (requires Developer role)
- `OrganizationsController` (`/api/organizations`) — Create org, join by invite code, list user's orgs
- `DeveloperController` (`/api/developer`) — Admin panel: platform stats, user management, org management

**Auth model:**
- JWT Bearer tokens (24-hour expiry by default)
- Roles: `Developer`, `Owner`, `Staff`, `User`
- Rate limiting: login 3/min per IP, register 5/min per IP
- Per-email `SemaphoreSlim` lock on registration to prevent duplicate users

**Multi-tenancy model:**
- One **Organization** has one or more **Branches**
- Organization has one Owner and up to 3 Staff members
- Staff join via an 8-character **InviteCode** on the Organization
- Bookings and ServiceTypes are scoped to an Organization

**DTOs live in** `Models/DTO/` — inputs (e.g., `LoginDto`, `CreateOrganizationDto`) and responses (e.g., `AuthResponseDto`, `OrganizationResponseDto`) are kept separate from EF entities in `Models/`.

### Frontend (`Frontend/SalonManagementSystemReact/`)

React 19 + Vite 8, styled with **Tailwind CSS 4** and **Radix UI** primitives.

**Key files:**
- `src/services/api.js` — Axios instance (base URL `https://localhost:7014`), JWT injected via request interceptor, 401 → redirect to login
- `src/context/AuthContext.jsx` — Global auth state: token, user info, current organization, roles; persisted in `localStorage`
- `src/context/ThemeContext.jsx` — Dark/light theme toggle
- `src/App.jsx` — React Router route tree

**Route protection:**
- `ProtectedRoute.jsx` — Requires authenticated user
- `DeveloperRoute.jsx` — Requires `Developer` role

**User flow:**
1. Login → JWT stored in `localStorage` via `AuthContext`
2. If user has organizations → Dashboard; otherwise → `OnboardingPage` (invite code entry)
3. `DeveloperPage` (`/developer`) is only accessible to the `Developer` role

**`src/components/ui/`** contains thin Radix UI wrappers (avatar, dialog, dropdown-menu, tabs, sheet, etc.) — use these rather than raw Radix primitives.

**`src/components/common/`** contains project-level reusable components (Button, Input, Card, etc.).

## Configuration Notes

- The backend CORS policy explicitly allows `http://localhost:3000` and `http://localhost:5173`.
- JWT secret in `appsettings.json` is a placeholder — must be replaced with a real 32+ character secret before any production deployment.
- Database credentials are currently in `appsettings.json`; use environment variables or user secrets (`dotnet user-secrets`) for local development to avoid committing credentials.
