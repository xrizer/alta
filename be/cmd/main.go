package main

import (
	"fmt"
	"log"

	"hris-backend/config"
	"hris-backend/internal/handler"
	"hris-backend/internal/middleware"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
	"hris-backend/internal/service"
	"hris-backend/pkg/hash"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	db := config.ConnectDatabase(cfg)

	seedAdmin(db, cfg)

	// Repositories
	userRepo := repository.NewUserRepository(db)
	companyRepo := repository.NewCompanyRepository(db)
	deptRepo := repository.NewDepartmentRepository(db)
	posRepo := repository.NewPositionRepository(db)
	shiftRepo := repository.NewShiftRepository(db)
	empRepo := repository.NewEmployeeRepository(db)
	empSalaryRepo := repository.NewEmployeeSalaryRepository(db)
	holidayRepo := repository.NewHolidayRepository(db)
	attRepo := repository.NewAttendanceRepository(db)
	leaveRepo := repository.NewLeaveRepository(db)
	payrollRepo := repository.NewPayrollRepository(db)

	// Services
	authService := service.NewAuthService(userRepo, cfg)
	userService := service.NewUserService(userRepo)
	companyService := service.NewCompanyService(companyRepo)
	deptService := service.NewDepartmentService(deptRepo, companyRepo)
	posService := service.NewPositionService(posRepo, companyRepo)
	shiftService := service.NewShiftService(shiftRepo, companyRepo)
	empService := service.NewEmployeeService(empRepo, userRepo, companyRepo, deptRepo, posRepo, shiftRepo)
	empSalaryService := service.NewEmployeeSalaryService(empSalaryRepo, empRepo)
	holidayService := service.NewHolidayService(holidayRepo, companyRepo)
	attService := service.NewAttendanceService(attRepo, empRepo)
	leaveService := service.NewLeaveService(leaveRepo, empRepo)
	payrollService := service.NewPayrollService(payrollRepo, empRepo, empSalaryRepo, attRepo)
	orgService := service.NewOrganizationService(companyRepo)
	menuAccessRepo := repository.NewMenuAccessRepository(db)
	menuAccessService := service.NewMenuAccessService(menuAccessRepo, userRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	companyHandler := handler.NewCompanyHandler(companyService)
	deptHandler := handler.NewDepartmentHandler(deptService)
	posHandler := handler.NewPositionHandler(posService)
	shiftHandler := handler.NewShiftHandler(shiftService)
	empHandler := handler.NewEmployeeHandler(empService)
	empSalaryHandler := handler.NewEmployeeSalaryHandler(empSalaryService)
	holidayHandler := handler.NewHolidayHandler(holidayService)
	attHandler := handler.NewAttendanceHandler(attService, empService)
	leaveHandler := handler.NewLeaveHandler(leaveService)
	payrollHandler := handler.NewPayrollHandler(payrollService)
	orgHandler := handler.NewOrganizationHandler(orgService)
	menuAccessHandler := handler.NewMenuAccessHandler(menuAccessService)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"success": false,
				"message": err.Error(),
			})
		},
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)

	users := api.Group("/users", middleware.AuthMiddleware(cfg))
	users.Get("/me", userHandler.GetMe)
	users.Get("/", middleware.RoleMiddleware("admin", "hr"), userHandler.GetAll)
	users.Get("/:id", userHandler.GetByID)
	users.Post("/", middleware.RoleMiddleware("admin"), userHandler.Create)
	users.Put("/:id", middleware.RoleMiddleware("admin"), userHandler.Update)
	users.Delete("/:id", middleware.RoleMiddleware("admin"), userHandler.Delete)

	// Company routes (admin only)
	companies := api.Group("/companies", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	companies.Get("/", companyHandler.GetAll)
	companies.Get("/:id", companyHandler.GetByID)
	companies.Post("/", middleware.RoleMiddleware("admin"), companyHandler.Create)
	companies.Put("/:id", middleware.RoleMiddleware("admin"), companyHandler.Update)
	companies.Delete("/:id", middleware.RoleMiddleware("admin"), companyHandler.Delete)

	// Department routes (admin, hr can view; admin can manage)
	departments := api.Group("/departments", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	departments.Get("/", deptHandler.GetAll)
	departments.Get("/:id", deptHandler.GetByID)
	departments.Post("/", middleware.RoleMiddleware("admin"), deptHandler.Create)
	departments.Put("/:id", middleware.RoleMiddleware("admin"), deptHandler.Update)
	departments.Delete("/:id", middleware.RoleMiddleware("admin"), deptHandler.Delete)

	// Position routes (admin, hr can view; admin can manage)
	positions := api.Group("/positions", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	positions.Get("/", posHandler.GetAll)
	positions.Get("/:id", posHandler.GetByID)
	positions.Post("/", middleware.RoleMiddleware("admin"), posHandler.Create)
	positions.Put("/:id", middleware.RoleMiddleware("admin"), posHandler.Update)
	positions.Delete("/:id", middleware.RoleMiddleware("admin"), posHandler.Delete)

	// Shift routes (admin, hr can view; admin can manage)
	shifts := api.Group("/shifts", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	shifts.Get("/", shiftHandler.GetAll)
	shifts.Get("/:id", shiftHandler.GetByID)
	shifts.Post("/", middleware.RoleMiddleware("admin"), shiftHandler.Create)
	shifts.Put("/:id", middleware.RoleMiddleware("admin"), shiftHandler.Update)
	shifts.Delete("/:id", middleware.RoleMiddleware("admin"), shiftHandler.Delete)

	// Employee routes (admin, hr can view all; admin can manage)
	employees := api.Group("/employees", middleware.AuthMiddleware(cfg))
	employees.Get("/me", empHandler.GetMe)
	employees.Get("/", middleware.RoleMiddleware("admin", "hr"), empHandler.GetAll)
	employees.Get("/:id", middleware.RoleMiddleware("admin", "hr"), empHandler.GetByID)
	employees.Post("/", middleware.RoleMiddleware("admin"), empHandler.Create)
	employees.Put("/:id", middleware.RoleMiddleware("admin"), empHandler.Update)
	employees.Delete("/:id", middleware.RoleMiddleware("admin"), empHandler.Delete)

	// Employee salary routes (admin, hr only)
	empSalaries := api.Group("/employee-salaries", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	empSalaries.Get("/", empSalaryHandler.GetAll)
	empSalaries.Get("/:id", empSalaryHandler.GetByID)
	empSalaries.Get("/employee/:employeeId/latest", empSalaryHandler.GetLatest)
	empSalaries.Post("/", middleware.RoleMiddleware("admin"), empSalaryHandler.Create)
	empSalaries.Put("/:id", middleware.RoleMiddleware("admin"), empSalaryHandler.Update)
	empSalaries.Delete("/:id", middleware.RoleMiddleware("admin"), empSalaryHandler.Delete)

	// Holiday routes (admin, hr can view; admin can manage)
	holidays := api.Group("/holidays", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	holidays.Get("/", holidayHandler.GetAll)
	holidays.Get("/:id", holidayHandler.GetByID)
	holidays.Post("/", middleware.RoleMiddleware("admin"), holidayHandler.Create)
	holidays.Put("/:id", middleware.RoleMiddleware("admin"), holidayHandler.Update)
	holidays.Delete("/:id", middleware.RoleMiddleware("admin"), holidayHandler.Delete)

	// Attendance routes
	attendances := api.Group("/attendances", middleware.AuthMiddleware(cfg))
	attendances.Get("/", attHandler.GetAll)
	attendances.Get("/:id", attHandler.GetByID)
	attendances.Post("/clock-in", attHandler.ClockIn)
	attendances.Put("/:id/clock-out", attHandler.ClockOut)
	attendances.Post("/", middleware.RoleMiddleware("admin", "hr"), attHandler.Create)
	attendances.Post("/import", middleware.RoleMiddleware("admin", "hr"), attHandler.Import)
	attendances.Put("/:id", middleware.RoleMiddleware("admin", "hr"), attHandler.Update)
	attendances.Delete("/:id", middleware.RoleMiddleware("admin"), attHandler.Delete)

	// Leave routes
	leaves := api.Group("/leaves", middleware.AuthMiddleware(cfg))
	leaves.Get("/", leaveHandler.GetAll)
	leaves.Get("/:id", leaveHandler.GetByID)
	leaves.Post("/", leaveHandler.Create)
	leaves.Put("/:id", leaveHandler.Update)
	leaves.Put("/:id/approve", middleware.RoleMiddleware("admin", "hr"), leaveHandler.Approve)
	leaves.Delete("/:id", leaveHandler.Delete)

	// Payroll routes (admin, hr only)
	payrolls := api.Group("/payrolls", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	payrolls.Get("/", payrollHandler.GetAll)
	payrolls.Get("/:id", payrollHandler.GetByID)
	payrolls.Post("/generate", payrollHandler.Generate)
	payrolls.Put("/:id", middleware.RoleMiddleware("admin"), payrollHandler.Update)
	payrolls.Put("/:id/status", middleware.RoleMiddleware("admin"), payrollHandler.UpdateStatus)
	payrolls.Delete("/:id", middleware.RoleMiddleware("admin"), payrollHandler.Delete)

	// Organization structure routes (admin, hr only)
	organization := api.Group("/organization", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	organization.Get("/structure", orgHandler.GetStructure)

	// Menu access routes
	menuAccess := api.Group("/menu-access", middleware.AuthMiddleware(cfg))
	menuAccess.Get("/me", menuAccessHandler.GetMyMenus)
	menuAccess.Get("/", middleware.RoleMiddleware("admin"), menuAccessHandler.GetAll)
	menuAccess.Post("/", middleware.RoleMiddleware("admin"), menuAccessHandler.Set)
	menuAccess.Delete("/:user_id", middleware.RoleMiddleware("admin"), menuAccessHandler.Delete)

	log.Printf("Server starting on port %s", cfg.AppPort)
	log.Fatal(app.Listen(fmt.Sprintf(":%s", cfg.AppPort)))
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&model.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		return
	}

	hashedPassword, err := hash.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	admin := &model.User{
		Name:     "Administrator",
		Email:    cfg.AdminEmail,
		Password: hashedPassword,
		Role:     model.RoleAdmin,
		IsActive: true,
	}

	if err := db.Create(admin).Error; err != nil {
		log.Printf("Failed to seed admin user: %v", err)
		return
	}

	log.Printf("Admin user seeded: %s", cfg.AdminEmail)
}
