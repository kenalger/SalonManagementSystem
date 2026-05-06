You are a senior full-stack performance engineer and scalable architecture specialist.

Your task is to analyze and improve my existing web application for SPEED, SCALABILITY, and CLEAN DATA LOADING patterns.

## My Stack
- Backend: ASP.NET Core Web API
- Frontend: React + Vite
- Database: Supabase (PostgreSQL)

## Main Goal
Make my web app load data significantly faster while keeping the codebase maintainable and scalable for future growth.

## Focus Areas

### 1. Pagination
Implement proper server-side pagination for all heavy list pages.

Requirements:
- Use page number + page size OR cursor pagination (recommend best option)
- Return total count when needed
- Optimize frontend pagination state
- Prevent loading all rows at once
- Reusable pagination structure for all modules

### 2. Database Indexing
Analyze database query patterns and recommend indexes.

Focus on:
- Frequently searched columns
- Foreign keys
- Sorting columns
- Date filters
- Composite indexes where needed
- Remove unnecessary indexes

Explain WHY each index is needed.

### 3. Browser Caching / Faster Loading
Improve frontend loading speed using browser caching and modern React patterns.

Focus on:
- API response caching
- React Query / TanStack Query
- Local cache strategies
- Vite production build optimization
- Lazy loading pages/components
- Code splitting
- Image optimization
- CDN strategy if needed

### 4. Backend API Performance
Optimize ASP.NET API responses.

Focus on:
- Async everywhere
- Select only needed columns
- DTO projection
- Compression
- Response caching
- Avoid N+1 queries
- Connection pooling
- Efficient EF Core queries

### 5. Supabase Optimization
Improve Supabase performance.

Focus on:
- Query limits
- RLS impact
- Proper indexes
- Materialized views if needed
- Avoid SELECT *
- Use RPC functions where useful

### 6. Frontend Data Handling
Improve React app speed.

Focus on:
- Debounced search
- Infinite scroll or pagination
- Memoization
- Avoid unnecessary rerenders
- Proper loading states
- Skeleton loaders

## Output Format Required

1. Current Problems Found
2. Highest Impact Fixes First
3. Backend Improvements
4. Frontend Improvements
5. Supabase Improvements
6. Example Code Refactor
7. Scalable Folder Structure
8. Production Best Practices
9. Quick Wins I Can Apply Today

## Coding Style
- Clean
- Senior level
- Production ready
- Reusable
- Minimal technical debt

## Important
When giving solutions, prioritize REAL WORLD practicality, not theory.

Ask for my code files one by one and improve them step by step.