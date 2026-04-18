package middleware

import (
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// RequireModule returns a Fiber middleware that 403s the request unless the
// caller's company has the given feature module enabled.
//
// Superadmins bypass the check (they can touch everything).
// Core modules are always enabled — this middleware should only be used to gate
// opt-in modules (visit_tracking, distributor_sync, reimbursement, etc.).
//
// The caller's company is derived from their employee record. The result is
// cached in Locals("companyID") so repeated checks within a request only hit
// the DB once.
func RequireModule(moduleKey string, modService service.ModuleService, empService service.EmployeeService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Superadmin bypass
		if role, _ := c.Locals("role").(string); role == "superadmin" {
			return c.Next()
		}

		userID, ok := c.Locals("userID").(string)
		if !ok || userID == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Missing user context")
		}

		// Resolve company_id (cached for the request)
		companyID, _ := c.Locals("companyID").(string)
		if companyID == "" {
			emp, err := empService.GetByUserID(userID)
			if err != nil || emp == nil || emp.CompanyID == "" {
				return response.Error(c, fiber.StatusForbidden, "No company context for user")
			}
			companyID = emp.CompanyID
			c.Locals("companyID", companyID)
		}

		enabled, err := modService.IsEnabled(companyID, moduleKey)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, err.Error())
		}
		if !enabled {
			return response.Error(c, fiber.StatusForbidden, "Module not enabled for this company: "+moduleKey)
		}
		return c.Next()
	}
}
