# Frontend - Next.js (App Router + TypeScript + Tailwind CSS)

## Architecture
```
fe/src/
├── app/
│   ├── layout.tsx                        # Root layout (AuthProvider wraps all pages)
│   ├── page.tsx                          # Redirects to /login
│   ├── login/page.tsx                    # Login form
│   └── dashboard/
│       ├── layout.tsx                    # Protected layout (sidebar + header, redirects if not logged in)
│       ├── page.tsx                      # Dashboard home
│       └── users/
│           ├── page.tsx                  # User list table
│           ├── create/page.tsx           # Create user form
│           └── [id]/edit/page.tsx        # Edit user form
├── components/
│   ├── sidebar.tsx                       # Navigation sidebar (role-filtered)
│   ├── header.tsx                        # Top bar with user info + logout
│   └── user-table.tsx                    # User data table with actions
├── contexts/
│   └── auth-context.tsx                  # AuthProvider: login, logout, user state, auto-refresh
├── lib/
│   ├── api.ts                            # Axios instance + interceptors (token attach, auto-refresh)
│   └── types.ts                          # Shared TypeScript interfaces (User, Role, API types)
├── services/
│   ├── auth-service.ts                   # login(), refreshToken(), logout()
│   └── user-service.ts                   # getUsers(), getUserById(), createUser(), updateUser(), deleteUser()
└── middleware.ts                         # Route protection (/ → /login redirect)
```

## Commands
- Dev: `npm run dev` (runs on :3000)
- Build: `npm run build`
- Lint: `npm run lint`

## Key Patterns
- **All pages under `/dashboard/`** are protected by `dashboard/layout.tsx` which checks auth state
- **API calls** go through `lib/api.ts` axios instance — it auto-attaches JWT and handles token refresh
- **Auth state** lives in `contexts/auth-context.tsx` — access via `useAuth()` hook
- **Role-based UI**: check `user.role` from `useAuth()` to show/hide elements (e.g., admin-only buttons)
- **API base URL**: set via `NEXT_PUBLIC_API_URL` env var (localhost:8080 for dev, `/api` for production via Nginx)
- **Styling**: Tailwind CSS utility classes only — no CSS modules or styled-components
- **Components are "use client"** — all pages use client-side rendering with hooks

## Auth Flow (Client-Side)
1. App loads → AuthProvider tries `refreshToken()` once → if success, sets user state
2. Login form → calls `login()` → sets access token in memory + refresh cookie → redirects to /dashboard
3. API calls → axios interceptor attaches `Authorization: Bearer <token>`
4. 401 response → interceptor auto-calls refresh → retries original request
5. Refresh fails → clears state, user stays on current page (no redirect loop)

## Adding a New Page/Module
1. Define TypeScript types in `lib/types.ts`
2. Create API service functions in `services/`
3. Create page in `app/dashboard/<module>/page.tsx`
4. Add navigation link in `components/sidebar.tsx` (with role filter)
5. Create any reusable components in `components/`

## API Response Format
All backend responses follow:
```typescript
{ success: boolean, message: string, data?: T }
```
Access via `response.data` (axios) → then check `.success` and `.data`.

## Environment Variables
- `NEXT_PUBLIC_API_URL` — Backend API URL
  - Dev: `http://localhost:8080/api`
  - Production: `/api` (proxied by Nginx)
