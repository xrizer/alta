# HRIS - Human Resource Information System

## Project Overview
HRIS application with Login & User Management modules. Monorepo with Go backend and Next.js frontend.

## Architecture
```
alta/
├── be/          → Go backend (Fiber + GORM + PostgreSQL)
├── fe/          → Next.js frontend (App Router + TypeScript + Tailwind)
├── nginx/       → Nginx reverse proxy config
├── docker-compose.yml → Production deployment
└── scripts/     → Deployment scripts
```

## Tech Stack
- **Backend**: Go 1.23, Fiber v2, GORM, PostgreSQL 16, JWT (access + refresh tokens), bcrypt
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Axios, React Context
- **Deployment**: Docker Compose, Nginx reverse proxy on GCP VM (136.112.30.58)

## API Pattern
- All API endpoints are under `/api/`
- Standard response format: `{ success: bool, message: string, data?: T }`
- Auth: JWT access token (15min) in Authorization header, refresh token (7d) in httpOnly cookie
- Roles: admin, hr, employee

## API Endpoints
| Method | Endpoint         | Access          |
|--------|------------------|-----------------|
| POST   | /api/auth/login  | Public          |
| POST   | /api/auth/refresh| Public          |
| POST   | /api/auth/logout | Authenticated   |
| GET    | /api/users       | Admin, HR       |
| GET    | /api/users/me    | Authenticated   |
| GET    | /api/users/:id   | Admin, HR, Self |
| POST   | /api/users       | Admin           |
| PUT    | /api/users/:id   | Admin           |
| DELETE | /api/users/:id   | Admin           |

## Running Locally
- Backend: `cd be && go run cmd/main.go` (runs on :8080)
- Frontend: `cd fe && npm run dev` (runs on :3000)
- Production: `docker compose up -d --build` (Nginx on :80)

## Default Admin
- Email: admin@hris.com
- Password: admin123

## Git Workflow
- `main` branch = production (deployed to GCP)
- BE developer works on `be/*` files, creates feature branches like `feature/be-xxx`
- FE developer works on `fe/*` files, creates feature branches like `feature/fe-xxx`
- Both devs should NOT modify each other's folder without coordination
