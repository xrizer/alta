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
	"hris-backend/pkg/signoz"
	"hris-backend/pkg/kafka"

	_ "hris-backend/docs" // swagger docs

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	fiberSwagger "github.com/swaggo/fiber-swagger"
	"gorm.io/gorm"
)

// @title HRIS API
// @version 1.0
// @description Human Resource Information System API with authentication and comprehensive HRIS modules
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@hris.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api
// @schemes http https

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	cfg := config.Load()
	signoz.Init(cfg.SigNozEndpoint, cfg.SigNozAccessToken, "hris-backend")
	db := config.ConnectDatabase(cfg)

	seedSuperAdmin(db, cfg)
	seedAdmin(db, cfg)
	seedJobLevels(db)

	// Kafka producer (fire-and-forget; logs errors if broker unavailable)
	kafkaProducer := kafka.NewProducer(cfg.KafkaBrokers, kafka.TopicNotifications)

	// Notification repository (needed by both the Kafka consumer and the HTTP handler)
	notifRepo := repository.NewNotificationRepository(db)

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
	jobLevelRepo := repository.NewJobLevelRepository(db)
	gradeRepo := repository.NewGradeRepository(db)

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
	attService := service.NewAttendanceService(attRepo, empRepo, shiftRepo)
	leaveService := service.NewLeaveService(leaveRepo, empRepo)
	payrollService := service.NewPayrollService(payrollRepo, empRepo, empSalaryRepo, attRepo)
	orgService := service.NewOrganizationService(companyRepo)
	menuAccessRepo := repository.NewMenuAccessRepository(db)
	menuAccessService := service.NewMenuAccessService(menuAccessRepo, userRepo)
	notifService := service.NewNotificationService(notifRepo)
	jobLevelService := service.NewJobLevelService(jobLevelRepo, companyRepo)
	gradeService := service.NewGradeService(gradeRepo, jobLevelRepo, companyRepo)

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
	leaveHandler := handler.NewLeaveHandler(leaveService, kafkaProducer)
	payrollHandler := handler.NewPayrollHandler(payrollService, empService)
	orgHandler := handler.NewOrganizationHandler(orgService)
	menuAccessHandler := handler.NewMenuAccessHandler(menuAccessService)
	notifHandler := handler.NewNotificationHandler(notifService)
	jobLevelHandler := handler.NewJobLevelHandler(jobLevelService)
	gradeHandler := handler.NewGradeHandler(gradeService)

	// Start Kafka consumer — processes events and writes notifications to DB
	processor := kafka.NewEventProcessor(notifRepo, userRepo)
	consumer := kafka.NewConsumer(cfg.KafkaBrokers, kafka.TopicNotifications, "hris-notification-group", processor.Handle)
	consumer.Start()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			attrs := map[string]interface{}{
				"service":     "hris-backend",
				"path":        c.Path(),
				"method":      c.Method(),
				"status_code": code,
			}
			if code >= 500 {
				signoz.LogError(err.Error(), attrs)
			} else {
				signoz.LogWarn(err.Error(), attrs)
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
	companies.Delete("/", middleware.RoleMiddleware("admin"), companyHandler.DeleteMultiple)
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

	// Payslips self-service route (all authenticated users)
	payrollsSelf := api.Group("/payrolls", middleware.AuthMiddleware(cfg))
	payrollsSelf.Get("/me", payrollHandler.GetMyPayslips)

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

	// Notification routes (all authenticated)
	notifications := api.Group("/notifications", middleware.AuthMiddleware(cfg))
	notifications.Get("/", notifHandler.GetMyNotifications)
	notifications.Get("/unread-count", notifHandler.GetUnreadCount)
	notifications.Put("/read-all", notifHandler.MarkAllAsRead)
	notifications.Put("/:id/read", notifHandler.MarkAsRead)

	// Job level routes (admin, hr can view; admin can manage)
	jobLevels := api.Group("/job-levels", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	jobLevels.Get("/", jobLevelHandler.GetAll)
	jobLevels.Get("/:id", jobLevelHandler.GetByID)
	jobLevels.Post("/", middleware.RoleMiddleware("admin"), jobLevelHandler.Create)
	jobLevels.Put("/:id", middleware.RoleMiddleware("admin"), jobLevelHandler.Update)
	jobLevels.Delete("/:id", middleware.RoleMiddleware("admin"), jobLevelHandler.Delete)

	// Grade routes (admin, hr can view; admin can manage)
	grades := api.Group("/grades", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin", "hr"))
	grades.Get("/", gradeHandler.GetAll)
	grades.Get("/:id", gradeHandler.GetByID)
	grades.Post("/", middleware.RoleMiddleware("admin"), gradeHandler.Create)
	grades.Put("/:id", middleware.RoleMiddleware("admin"), gradeHandler.Update)
	grades.Delete("/:id", middleware.RoleMiddleware("admin"), gradeHandler.Delete)

	// Swagger documentation
	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	log.Printf("Server starting on port %s", cfg.AppPort)
	log.Fatal(app.Listen(fmt.Sprintf(":%s", cfg.AppPort)))
}

func seedSuperAdmin(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&model.User{}).Where("role = ?", "superadmin").Count(&count)
	if count > 0 {
		return
	}

	hashedPassword, err := hash.HashPassword(cfg.SuperAdminPassword)
	if err != nil {
		log.Printf("Failed to hash superadmin password: %v", err)
		return
	}

	superAdmin := &model.User{
		Name:     "Super Administrator",
		Email:    cfg.SuperAdminEmail,
		Password: hashedPassword,
		Role:     model.RoleSuperAdmin,
		IsActive: true,
	}

	if err := db.Create(superAdmin).Error; err != nil {
		log.Printf("Failed to seed superadmin user: %v", err)
		return
	}

	log.Printf("Superadmin user seeded: %s", cfg.SuperAdminEmail)
}

func seedJobLevels(db *gorm.DB) {
	// Skip if any job levels already exist
	var count int64
	db.Model(&model.JobLevel{}).Count(&count)
	if count > 0 {
		return
	}

	// Find the first company to attach levels to
	var company model.Company
	if err := db.First(&company).Error; err != nil {
		return // No company yet — levels will be created manually
	}

	levels := []model.JobLevel{
		{CompanyID: company.ID, Name: "Staff", LevelOrder: 1, IsActive: true},
		{CompanyID: company.ID, Name: "Senior Staff", LevelOrder: 2, IsActive: true},
		{CompanyID: company.ID, Name: "Supervisor", LevelOrder: 3, IsActive: true},
		{CompanyID: company.ID, Name: "Manager", LevelOrder: 4, IsActive: true},
		{CompanyID: company.ID, Name: "Senior Manager", LevelOrder: 5, IsActive: true},
		{CompanyID: company.ID, Name: "Director", LevelOrder: 6, IsActive: true},
	}

	for i := range levels {
		if err := db.Create(&levels[i]).Error; err != nil {
			log.Printf("Failed to seed job level %s: %v", levels[i].Name, err)
		}
	}
	log.Printf("Job levels seeded for company: %s", company.Name)
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
