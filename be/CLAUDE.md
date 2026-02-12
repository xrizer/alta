# Backend - Go (Fiber + GORM + PostgreSQL)

## Architecture
Clean architecture pattern: **Handler → Service → Repository**

```
be/
├── cmd/main.go                    # Entry point, routing, DI wiring, admin seeder
├── config/
│   ├── config.go                  # Env loading (Config struct)
│   └── database.go                # PostgreSQL connection + auto-migrate
├── internal/
│   ├── model/user.go              # GORM model (UUID PK, soft delete, Role enum)
│   ├── dto/
│   │   ├── auth_dto.go            # LoginRequest, TokenResponse
│   │   └── user_dto.go            # CreateUserRequest, UpdateUserRequest, UserResponse
│   ├── repository/
│   │   └── user_repository.go     # UserRepository interface + GORM implementation
│   ├── service/
│   │   ├── auth_service.go        # Login, RefreshToken logic
│   │   └── user_service.go        # CRUD + validation logic
│   ├── handler/
│   │   ├── auth_handler.go        # HTTP handlers for /api/auth/*
│   │   └── user_handler.go        # HTTP handlers for /api/users/*
│   └── middleware/
│       ├── auth_middleware.go      # JWT token validation, sets userID/email/role in Locals
│       └── role_middleware.go      # Role-based access control
├── pkg/
│   ├── jwt/jwt.go                 # Generate/Validate access & refresh tokens
│   ├── hash/hash.go               # bcrypt hash & check
│   └── response/response.go       # Standard JSON response helper
└── .env                           # Environment config (DO NOT commit)
```

## Commands
- Build: `go build ./...`
- Run: `go run cmd/main.go`
- Test: `go test ./...`
- Add dependency: `go get <package>`

## Key Patterns
- **All new endpoints** must follow: create DTO → add repo method → add service method → add handler → register route in main.go
- **Repository** uses interface pattern for testability
- **Middleware chain**: Logger → CORS → AuthMiddleware → RoleMiddleware → Handler
- **Errors** return standard `{ success: false, message: "..." }` via `pkg/response`
- **User IDs** are UUID strings (auto-generated via BeforeCreate hook)
- **Soft delete**: GORM `DeletedAt` field — records are never physically deleted
- **Config**: All env vars loaded in `config/config.go` — add new vars there first

## Database
- PostgreSQL 16, auto-migrated via GORM
- Single table: `users` (id, name, email, password, role, phone, address, is_active, created_at, updated_at, deleted_at)
- Roles: admin, hr, employee (stored as varchar)

## Auth Flow
1. Login: validate email/password → generate access token (15m) + refresh token (7d httpOnly cookie)
2. Authenticated requests: Bearer token in Authorization header → auth_middleware extracts claims → sets Locals
3. Refresh: read refresh_token cookie → validate → issue new pair
4. Logout: clear refresh_token cookie

## Adding a New Module (e.g., Department, Attendance)
1. Create model in `internal/model/`
2. Add migration in `config/database.go` AutoMigrate
3. Create DTOs in `internal/dto/`
4. Create repository interface + implementation in `internal/repository/`
5. Create service in `internal/service/`
6. Create handler in `internal/handler/`
7. Register routes in `cmd/main.go`
8. Coordinate with FE developer on API contract (request/response format)

## Environment Variables
See `.env.example` for all available config options.
