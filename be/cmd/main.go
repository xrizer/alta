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

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo, cfg)
	userService := service.NewUserService(userRepo)
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)

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
