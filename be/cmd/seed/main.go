package main

import (
	"fmt"
	"log"
	"time"

	"hris-backend/config"
	"hris-backend/internal/model"
	"hris-backend/pkg/calculator"
	"hris-backend/pkg/hash"

	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	db := config.ConnectDatabase(cfg)

	log.Println("🌱 Starting HRIS database seed...")

	// ── 1. Users ──────────────────────────────────────────────
	log.Println("→ Seeding users...")
	users := seedUsers(db)

	// ── 2. Company ────────────────────────────────────────────
	log.Println("→ Seeding company...")
	company := seedCompany(db)

	// ── 3. Departments ────────────────────────────────────────
	log.Println("→ Seeding departments...")
	departments := seedDepartments(db, company.ID)

	// ── 4. Positions ──────────────────────────────────────────
	log.Println("→ Seeding positions...")
	positions := seedPositions(db, company.ID)

	// ── 5. Shifts ─────────────────────────────────────────────
	log.Println("→ Seeding shifts...")
	shifts := seedShifts(db, company.ID)

	// ── 6. Holidays ───────────────────────────────────────────
	log.Println("→ Seeding holidays...")
	seedHolidays(db, company.ID)

	// ── 7. Employees ──────────────────────────────────────────
	log.Println("→ Seeding employees...")
	employees := seedEmployees(db, users, company.ID, departments, positions, shifts)

	// ── 8. Employee Salaries ──────────────────────────────────
	log.Println("→ Seeding employee salaries...")
	seedEmployeeSalaries(db, employees)

	// ── 9. Attendance ─────────────────────────────────────────
	log.Println("→ Seeding attendance records...")
	seedAttendance(db, employees, shifts)

	// ── 10. Leaves ────────────────────────────────────────────
	log.Println("→ Seeding leave requests...")
	seedLeaves(db, employees, users)

	// ── 11. Payroll ───────────────────────────────────────────
	log.Println("→ Seeding payroll records...")
	seedPayroll(db, employees)

	log.Println("✅ Seed completed successfully!")
	log.Println("")
	log.Println("══════════════════════════════════════════════")
	log.Println("  Sample Login Accounts:")
	log.Println("══════════════════════════════════════════════")
	log.Println("  Admin:    admin@hris.com      / admin123")
	log.Println("  HR:       hr@altanova.co.id   / password123")
	log.Println("  Employee: budi@altanova.co.id / password123")
	log.Println("  Employee: siti@altanova.co.id / password123")
	log.Println("  Employee: andi@altanova.co.id / password123")
	log.Println("══════════════════════════════════════════════")
}

// ═══════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════

func seedUsers(db *gorm.DB) []model.User {
	pw, _ := hash.HashPassword("password123")

	users := []model.User{
		{
			Name:     "Dewi Kartika",
			Email:    "hr@altanova.co.id",
			Password: pw,
			Role:     model.RoleHR,
			Phone:    "081234567891",
			Address:  "Jl. Sudirman No. 12, Jakarta Selatan",
			IsActive: true,
		},
		{
			Name:     "Budi Santoso",
			Email:    "budi@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567892",
			Address:  "Jl. Gatot Subroto No. 45, Jakarta Selatan",
			IsActive: true,
		},
		{
			Name:     "Siti Rahayu",
			Email:    "siti@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567893",
			Address:  "Jl. Kuningan No. 78, Jakarta Selatan",
			IsActive: true,
		},
		{
			Name:     "Andi Wijaya",
			Email:    "andi@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567894",
			Address:  "Jl. Rasuna Said No. 23, Jakarta Selatan",
			IsActive: true,
		},
		{
			Name:     "Rina Permata",
			Email:    "rina@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567895",
			Address:  "Jl. Thamrin No. 56, Jakarta Pusat",
			IsActive: true,
		},
		{
			Name:     "Fajar Nugroho",
			Email:    "fajar@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567896",
			Address:  "Jl. HR Rasuna Said Kav. 10, Jakarta Selatan",
			IsActive: true,
		},
		{
			Name:     "Maya Sari",
			Email:    "maya@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567897",
			Address:  "Jl. Menteng Raya No. 31, Jakarta Pusat",
			IsActive: true,
		},
		{
			Name:     "Rizky Pratama",
			Email:    "rizky@altanova.co.id",
			Password: pw,
			Role:     model.RoleEmployee,
			Phone:    "081234567898",
			Address:  "Jl. Kemang Raya No. 88, Jakarta Selatan",
			IsActive: true,
		},
	}

	for i := range users {
		if err := db.Create(&users[i]).Error; err != nil {
			log.Printf("  ⚠ User %s already exists or error: %v", users[i].Email, err)
			// try to find existing
			db.Where("email = ?", users[i].Email).First(&users[i])
		}
	}

	log.Printf("  ✓ %d users seeded", len(users))
	return users
}

// ═══════════════════════════════════════════════════════════════
// Company
// ═══════════════════════════════════════════════════════════════

func seedCompany(db *gorm.DB) model.Company {
	company := model.Company{
		Name:     "PT Alta Nova Indonesia",
		Address:  "Jl. Jend. Sudirman Kav. 52-53, SCBD Lot 9, Jakarta Selatan 12190",
		Phone:    "021-5551234",
		Email:    "info@altanova.co.id",
		NPWP:     "01.234.567.8-012.000",
		IsActive: true,
	}

	if err := db.Create(&company).Error; err != nil {
		log.Printf("  ⚠ Company exists or error: %v", err)
		db.Where("name = ?", company.Name).First(&company)
	}

	log.Printf("  ✓ Company: %s (ID: %s)", company.Name, company.ID)
	return company
}

// ═══════════════════════════════════════════════════════════════
// Departments
// ═══════════════════════════════════════════════════════════════

func seedDepartments(db *gorm.DB, companyID string) map[string]model.Department {
	deptData := []struct {
		Name        string
		Description string
	}{
		{"Engineering", "Software development and engineering team"},
		{"Human Resources", "HR operations, recruitment, and people management"},
		{"Finance & Accounting", "Financial planning, accounting, and tax compliance"},
		{"Marketing", "Brand management, digital marketing, and communications"},
		{"Operations", "Business operations and logistics management"},
	}

	departments := make(map[string]model.Department)
	for _, d := range deptData {
		dept := model.Department{
			CompanyID:   companyID,
			Name:        d.Name,
			Description: d.Description,
			IsActive:    true,
		}
		if err := db.Create(&dept).Error; err != nil {
			log.Printf("  ⚠ Department %s error: %v", d.Name, err)
			db.Where("name = ? AND company_id = ?", d.Name, companyID).First(&dept)
		}
		departments[d.Name] = dept
	}

	log.Printf("  ✓ %d departments seeded", len(departments))
	return departments
}

// ═══════════════════════════════════════════════════════════════
// Positions
// ═══════════════════════════════════════════════════════════════

func seedPositions(db *gorm.DB, companyID string) map[string]model.Position {
	posData := []struct {
		Name       string
		BaseSalary float64
	}{
		{"Software Engineer", 12000000},
		{"Senior Software Engineer", 18000000},
		{"Engineering Manager", 25000000},
		{"HR Manager", 20000000},
		{"HR Staff", 8000000},
		{"Finance Manager", 22000000},
		{"Accountant", 10000000},
		{"Marketing Manager", 20000000},
		{"Marketing Staff", 8500000},
		{"Operations Manager", 18000000},
	}

	positions := make(map[string]model.Position)
	for _, p := range posData {
		pos := model.Position{
			CompanyID:  companyID,
			Name:       p.Name,
			BaseSalary: p.BaseSalary,
			IsActive:   true,
		}
		if err := db.Create(&pos).Error; err != nil {
			log.Printf("  ⚠ Position %s error: %v", p.Name, err)
			db.Where("name = ? AND company_id = ?", p.Name, companyID).First(&pos)
		}
		positions[p.Name] = pos
	}

	log.Printf("  ✓ %d positions seeded", len(positions))
	return positions
}

// ═══════════════════════════════════════════════════════════════
// Shifts
// ═══════════════════════════════════════════════════════════════

func seedShifts(db *gorm.DB, companyID string) map[string]model.Shift {
	shiftData := []struct {
		Name      string
		StartTime string
		EndTime   string
	}{
		{"Regular (09:00 - 18:00)", "09:00:00", "18:00:00"},
		{"Morning (07:00 - 16:00)", "07:00:00", "16:00:00"},
		{"Flexible (10:00 - 19:00)", "10:00:00", "19:00:00"},
	}

	shifts := make(map[string]model.Shift)
	for _, s := range shiftData {
		shift := model.Shift{
			CompanyID: companyID,
			Name:      s.Name,
			StartTime: s.StartTime,
			EndTime:   s.EndTime,
			IsActive:  true,
		}
		if err := db.Create(&shift).Error; err != nil {
			log.Printf("  ⚠ Shift %s error: %v", s.Name, err)
			db.Where("name = ? AND company_id = ?", s.Name, companyID).First(&shift)
		}
		shifts[s.Name] = shift
	}

	log.Printf("  ✓ %d shifts seeded", len(shifts))
	return shifts
}

// ═══════════════════════════════════════════════════════════════
// Holidays (2025)
// ═══════════════════════════════════════════════════════════════

func seedHolidays(db *gorm.DB, companyID string) {
	holidays := []struct {
		Name       string
		Date       string
		IsNational bool
	}{
		{"Tahun Baru 2025", "2025-01-01", true},
		{"Isra Mi'raj Nabi Muhammad SAW", "2025-01-27", true},
		{"Tahun Baru Imlek 2576", "2025-01-29", true},
		{"Hari Raya Nyepi", "2025-03-29", true},
		{"Wafat Isa Al Masih", "2025-04-18", true},
		{"Hari Raya Idul Fitri 1446 H", "2025-03-31", true},
		{"Cuti Bersama Idul Fitri", "2025-04-01", true},
		{"Cuti Bersama Idul Fitri", "2025-04-02", true},
		{"Cuti Bersama Idul Fitri", "2025-04-03", true},
		{"Cuti Bersama Idul Fitri", "2025-04-04", true},
		{"Hari Buruh Internasional", "2025-05-01", true},
		{"Kenaikan Isa Al Masih", "2025-05-29", true},
		{"Hari Lahir Pancasila", "2025-06-01", true},
		{"Hari Raya Idul Adha 1446 H", "2025-06-07", true},
		{"Tahun Baru Islam 1447 H", "2025-06-27", true},
		{"Hari Kemerdekaan RI", "2025-08-17", true},
		{"Maulid Nabi Muhammad SAW", "2025-09-05", true},
		{"Hari Natal", "2025-12-25", true},
		{"Cuti Bersama Natal", "2025-12-26", false},
		{"HUT PT Alta Nova Indonesia", "2025-07-15", false},
	}

	count := 0
	for _, h := range holidays {
		date, _ := time.Parse("2006-01-02", h.Date)
		holiday := model.Holiday{
			CompanyID:  companyID,
			Name:       h.Name,
			Date:       date,
			IsNational: h.IsNational,
		}
		if err := db.Create(&holiday).Error; err != nil {
			log.Printf("  ⚠ Holiday %s error: %v", h.Name, err)
		} else {
			count++
		}
	}

	log.Printf("  ✓ %d holidays seeded", count)
}

// ═══════════════════════════════════════════════════════════════
// Employees
// ═══════════════════════════════════════════════════════════════

func seedEmployees(
	db *gorm.DB,
	users []model.User,
	companyID string,
	departments map[string]model.Department,
	positions map[string]model.Position,
	shifts map[string]model.Shift,
) []model.Employee {

	regularShift := shifts["Regular (09:00 - 18:00)"]
	morningShift := shifts["Morning (07:00 - 16:00)"]
	flexShift := shifts["Flexible (10:00 - 19:00)"]

	birthDate1 := time.Date(1990, 3, 15, 0, 0, 0, 0, time.UTC)
	birthDate2 := time.Date(1988, 7, 22, 0, 0, 0, 0, time.UTC)
	birthDate3 := time.Date(1992, 11, 5, 0, 0, 0, 0, time.UTC)
	birthDate4 := time.Date(1995, 1, 10, 0, 0, 0, 0, time.UTC)
	birthDate5 := time.Date(1991, 6, 18, 0, 0, 0, 0, time.UTC)
	birthDate6 := time.Date(1993, 9, 25, 0, 0, 0, 0, time.UTC)
	birthDate7 := time.Date(1994, 4, 8, 0, 0, 0, 0, time.UTC)
	birthDate8 := time.Date(1996, 12, 30, 0, 0, 0, 0, time.UTC)

	empData := []struct {
		UserIndex      int
		DeptName       string
		PosName        string
		Shift          model.Shift
		EmpNumber      string
		NIK            string
		Gender         string
		BirthPlace     string
		BirthDate      *time.Time
		MaritalStatus  string
		Religion       string
		BloodType      string
		LastEducation  string
		JoinDate       string
		EmployeeStatus model.EmployeeStatus
		BankName       string
		BankAccount    string
		BPJSKesNo      string
		BPJSTKNo       string
		NPWP           string
	}{
		// Dewi - HR Manager
		{0, "Human Resources", "HR Manager", regularShift, "ALT-001", "3175014503900001", "female", "Jakarta", &birthDate1, "married", "Islam", "O", "S1", "2022-01-15", model.StatusTetap, "BCA", "1234567890", "0001234567890", "TK001234567890", "12.345.678.9-012.000"},
		// Budi - Senior Software Engineer
		{1, "Engineering", "Senior Software Engineer", flexShift, "ALT-002", "3175012207880002", "male", "Bandung", &birthDate2, "married", "Islam", "A", "S1", "2022-03-01", model.StatusTetap, "BCA", "1234567891", "0001234567891", "TK001234567891", "23.456.789.0-012.000"},
		// Siti - Accountant
		{2, "Finance & Accounting", "Accountant", regularShift, "ALT-003", "3175010511920003", "female", "Surabaya", &birthDate3, "single", "Islam", "B", "S1", "2023-02-01", model.StatusTetap, "Mandiri", "2345678901", "0001234567892", "TK001234567892", "34.567.890.1-012.000"},
		// Andi - Software Engineer
		{3, "Engineering", "Software Engineer", flexShift, "ALT-004", "3175011001950004", "male", "Yogyakarta", &birthDate4, "single", "Islam", "AB", "S1", "2023-06-01", model.StatusKontrak, "BRI", "3456789012", "0001234567893", "TK001234567893", "45.678.901.2-012.000"},
		// Rina - Marketing Manager
		{4, "Marketing", "Marketing Manager", regularShift, "ALT-005", "3175011806910005", "female", "Semarang", &birthDate5, "married", "Kristen", "O", "S2", "2022-06-01", model.StatusTetap, "BCA", "4567890123", "0001234567894", "TK001234567894", "56.789.012.3-012.000"},
		// Fajar - Engineering Manager
		{5, "Engineering", "Engineering Manager", flexShift, "ALT-006", "3175012509930006", "male", "Medan", &birthDate6, "married", "Islam", "A", "S2", "2021-08-01", model.StatusTetap, "Mandiri", "5678901234", "0001234567895", "TK001234567895", "67.890.123.4-012.000"},
		// Maya - HR Staff
		{6, "Human Resources", "HR Staff", regularShift, "ALT-007", "3175010804940007", "female", "Makassar", &birthDate7, "single", "Islam", "B", "S1", "2024-01-15", model.StatusProbation, "BNI", "6789012345", "0001234567896", "TK001234567896", "78.901.234.5-012.000"},
		// Rizky - Marketing Staff
		{7, "Marketing", "Marketing Staff", morningShift, "ALT-008", "3175013012960008", "male", "Bali", &birthDate8, "single", "Hindu", "O", "D3", "2024-03-01", model.StatusKontrak, "BCA", "7890123456", "0001234567897", "TK001234567897", "89.012.345.6-012.000"},
	}

	employees := make([]model.Employee, 0, len(empData))
	for _, e := range empData {
		joinDate, _ := time.Parse("2006-01-02", e.JoinDate)
		emp := model.Employee{
			UserID:         users[e.UserIndex].ID,
			CompanyID:      companyID,
			DepartmentID:   departments[e.DeptName].ID,
			PositionID:     positions[e.PosName].ID,
			ShiftID:        e.Shift.ID,
			EmployeeNumber: e.EmpNumber,
			NIK:            e.NIK,
			Gender:         e.Gender,
			BirthPlace:     e.BirthPlace,
			BirthDate:      e.BirthDate,
			MaritalStatus:  e.MaritalStatus,
			Religion:       e.Religion,
			BloodType:      e.BloodType,
			LastEducation:  e.LastEducation,
			JoinDate:       joinDate,
			EmployeeStatus: e.EmployeeStatus,
			BankName:       e.BankName,
			BankAccount:    e.BankAccount,
			BPJSKesNo:      e.BPJSKesNo,
			BPJSTKNo:       e.BPJSTKNo,
			NPWP:           e.NPWP,
		}

		if err := db.Create(&emp).Error; err != nil {
			log.Printf("  ⚠ Employee %s error: %v", e.EmpNumber, err)
			db.Where("employee_number = ?", e.EmpNumber).First(&emp)
		}
		employees = append(employees, emp)
	}

	log.Printf("  ✓ %d employees seeded", len(employees))
	return employees
}

// ═══════════════════════════════════════════════════════════════
// Employee Salaries (with auto BPJS calculation)
// ═══════════════════════════════════════════════════════════════

func seedEmployeeSalaries(db *gorm.DB, employees []model.Employee) {
	salaryData := []struct {
		BasicSalary        float64
		TransportAllowance float64
		MealAllowance      float64
		HousingAllowance   float64
		PositionAllowance  float64
		EffectiveDate      string
	}{
		// Dewi - HR Manager
		{20000000, 1500000, 1000000, 2000000, 2500000, "2024-01-01"},
		// Budi - Senior Software Engineer
		{18000000, 1500000, 1000000, 0, 2000000, "2024-01-01"},
		// Siti - Accountant
		{10000000, 1000000, 750000, 0, 1000000, "2024-01-01"},
		// Andi - Software Engineer
		{12000000, 1000000, 750000, 0, 1500000, "2024-01-01"},
		// Rina - Marketing Manager
		{20000000, 1500000, 1000000, 2000000, 2500000, "2024-01-01"},
		// Fajar - Engineering Manager
		{25000000, 2000000, 1000000, 3000000, 3000000, "2024-01-01"},
		// Maya - HR Staff
		{8000000, 750000, 500000, 0, 500000, "2024-01-15"},
		// Rizky - Marketing Staff
		{8500000, 750000, 500000, 0, 500000, "2024-03-01"},
	}

	for i, s := range salaryData {
		effectiveDate, _ := time.Parse("2006-01-02", s.EffectiveDate)

		// Calculate BPJS
		kesEmp, kesCo, jhtEmp, jhtCo, jkk, jkm, jpEmp, jpCo := calculator.CalculateBPJS(s.BasicSalary)

		salary := model.EmployeeSalary{
			EmployeeID:         employees[i].ID,
			BasicSalary:        s.BasicSalary,
			TransportAllowance: s.TransportAllowance,
			MealAllowance:      s.MealAllowance,
			HousingAllowance:   s.HousingAllowance,
			PositionAllowance:  s.PositionAllowance,
			BPJSKesEmployee:    kesEmp,
			BPJSKesCompany:     kesCo,
			BPJSTKJHTEmployee:  jhtEmp,
			BPJSTKJHTCompany:   jhtCo,
			BPJSTKJKK:         jkk,
			BPJSTKJKM:         jkm,
			BPJSTKJPEmployee:   jpEmp,
			BPJSTKJPCompany:    jpCo,
			EffectiveDate:      effectiveDate,
		}

		if err := db.Create(&salary).Error; err != nil {
			log.Printf("  ⚠ Salary for employee %s error: %v", employees[i].EmployeeNumber, err)
		}
	}

	log.Printf("  ✓ %d employee salaries seeded", len(salaryData))
}

// ═══════════════════════════════════════════════════════════════
// Attendance (last 2 weeks of working days)
// ═══════════════════════════════════════════════════════════════

func seedAttendance(db *gorm.DB, employees []model.Employee, shifts map[string]model.Shift) {
	now := time.Now()
	count := 0

	// Generate attendance for the last 14 calendar days
	for dayOffset := 14; dayOffset >= 1; dayOffset-- {
		date := now.AddDate(0, 0, -dayOffset)

		// Skip weekends
		if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
			continue
		}

		for empIdx, emp := range employees {
			var clockInHour, clockInMin int
			var clockOutHour, clockOutMin int
			var status model.AttendanceStatus
			var overtime float64
			var notes string
			var shiftID string

			// Determine shift for this employee
			switch {
			case empIdx == 7: // Rizky - morning shift
				shiftID = shifts["Morning (07:00 - 16:00)"].ID
				clockInHour, clockInMin = 7, 5
				clockOutHour, clockOutMin = 16, 10
			case empIdx == 1 || empIdx == 3 || empIdx == 5: // Engineering - flex shift
				shiftID = shifts["Flexible (10:00 - 19:00)"].ID
				clockInHour, clockInMin = 10, 3
				clockOutHour, clockOutMin = 19, 15
			default: // Regular shift
				shiftID = shifts["Regular (09:00 - 18:00)"].ID
				clockInHour, clockInMin = 8, 55
				clockOutHour, clockOutMin = 18, 5
			}

			status = model.AttendanceHadir

			// Add some variety
			switch {
			case dayOffset == 10 && empIdx == 3: // Andi late one day
				clockInHour = 10
				clockInMin = 45
				status = model.AttendanceTerlambat
				notes = "Macet di Sudirman"
			case dayOffset == 8 && empIdx == 2: // Siti sick one day
				status = model.AttendanceSakit
				notes = "Demam, istirahat di rumah"
				clockInHour, clockInMin = 0, 0
				clockOutHour, clockOutMin = 0, 0
			case dayOffset == 5 && empIdx == 6: // Maya izin
				status = model.AttendanceIzin
				notes = "Keperluan keluarga"
				clockInHour, clockInMin = 0, 0
				clockOutHour, clockOutMin = 0, 0
			case dayOffset == 3 && empIdx == 1: // Budi overtime
				clockOutHour = 21
				clockOutMin = 30
				overtime = 2.5
				notes = "Sprint deadline"
			case dayOffset == 2 && empIdx == 5: // Fajar overtime
				clockOutHour = 20
				clockOutMin = 0
				overtime = 1.0
				notes = "Code review mendesak"
			}

			clockIn := time.Date(date.Year(), date.Month(), date.Day(), clockInHour, clockInMin, 0, 0, time.Local)
			clockOut := time.Date(date.Year(), date.Month(), date.Day(), clockOutHour, clockOutMin, 0, 0, time.Local)

			att := model.Attendance{
				EmployeeID:    emp.ID,
				ShiftID:       shiftID,
				Date:          date,
				Status:        status,
				OvertimeHours: overtime,
				Notes:         notes,
			}

			// Only set clock times for present employees
			if status == model.AttendanceHadir || status == model.AttendanceTerlambat {
				att.ClockIn = &clockIn
				att.ClockOut = &clockOut
			}

			if err := db.Create(&att).Error; err != nil {
				log.Printf("  ⚠ Attendance error for %s on %s: %v", emp.EmployeeNumber, date.Format("2006-01-02"), err)
			} else {
				count++
			}
		}
	}

	log.Printf("  ✓ %d attendance records seeded", count)
}

// ═══════════════════════════════════════════════════════════════
// Leaves
// ═══════════════════════════════════════════════════════════════

func seedLeaves(db *gorm.DB, employees []model.Employee, users []model.User) {
	// Find admin user for approvals
	var adminUser model.User
	db.Where("role = ?", "admin").First(&adminUser)
	approvedAt := time.Now().AddDate(0, 0, -5)

	leaves := []struct {
		EmpIndex        int
		LeaveType       model.LeaveType
		StartDate       string
		EndDate         string
		TotalDays       int
		Reason          string
		Status          model.LeaveStatus
		ApprovedBy      string
		RejectionReason string
	}{
		// Approved annual leave - Budi
		{1, model.LeaveCutiTahunan, "2025-03-10", "2025-03-14", 5, "Liburan keluarga ke Bali", model.LeaveStatusApproved, adminUser.ID, ""},
		// Approved sick leave - Siti
		{2, model.LeaveCutiSakit, "2025-02-03", "2025-02-04", 2, "Flu berat, perlu istirahat", model.LeaveStatusApproved, adminUser.ID, ""},
		// Pending annual leave - Andi
		{3, model.LeaveCutiTahunan, "2025-03-24", "2025-03-28", 5, "Mudik ke Yogyakarta", model.LeaveStatusPending, "", ""},
		// Rejected leave - Rina
		{4, model.LeaveCutiTahunan, "2025-02-17", "2025-02-21", 5, "Liburan ke Jepang", model.LeaveStatusRejected, adminUser.ID, "Bertabrakan dengan event marketing besar, mohon ajukan tanggal lain"},
		// Pending izin - Maya
		{6, model.LeaveIzin, "2025-03-17", "2025-03-17", 1, "Mengurus perpanjangan SIM", model.LeaveStatusPending, "", ""},
		// Approved maternity - Dewi
		{0, model.LeaveCutiMelahirkan, "2025-04-01", "2025-06-30", 90, "Cuti melahirkan anak kedua", model.LeaveStatusApproved, adminUser.ID, ""},
		// Approved business travel - Fajar
		{5, model.LeaveDinasLuar, "2025-02-24", "2025-02-26", 3, "Client visit ke Surabaya", model.LeaveStatusApproved, adminUser.ID, ""},
		// Pending sick leave - Rizky
		{7, model.LeaveCutiSakit, "2025-03-03", "2025-03-04", 2, "Sakit gigi, perlu ke dokter", model.LeaveStatusPending, "", ""},
	}

	for _, l := range leaves {
		startDate, _ := time.Parse("2006-01-02", l.StartDate)
		endDate, _ := time.Parse("2006-01-02", l.EndDate)

		leave := model.Leave{
			EmployeeID:      employees[l.EmpIndex].ID,
			LeaveType:       l.LeaveType,
			StartDate:       startDate,
			EndDate:         endDate,
			TotalDays:       l.TotalDays,
			Reason:          l.Reason,
			Status:          l.Status,
			RejectionReason: l.RejectionReason,
		}

		if l.ApprovedBy != "" {
			leave.ApprovedBy = l.ApprovedBy
			leave.ApprovedAt = &approvedAt
		}

		if err := db.Create(&leave).Error; err != nil {
			log.Printf("  ⚠ Leave error for %s: %v", employees[l.EmpIndex].EmployeeNumber, err)
		}
	}

	log.Printf("  ✓ %d leave requests seeded", len(leaves))
}

// ═══════════════════════════════════════════════════════════════
// Payroll (January 2025 - fully processed)
// ═══════════════════════════════════════════════════════════════

func seedPayroll(db *gorm.DB, employees []model.Employee) {
	paidAt := time.Date(2025, 1, 31, 15, 0, 0, 0, time.Local)

	payrollData := []struct {
		BasicSalary     float64
		TotalAllowances float64
		OvertimePay     float64
		WorkingDays     int
		PresentDays     int
		Status          model.PayrollStatus
	}{
		// Dewi - HR Manager (paid)
		{20000000, 7000000, 0, 22, 22, model.PayrollPaid},
		// Budi - Sr. Software Engineer (paid)
		{18000000, 4500000, 519653, 22, 22, model.PayrollPaid},
		// Siti - Accountant (paid)
		{10000000, 2750000, 0, 22, 21, model.PayrollPaid},
		// Andi - Software Engineer (processed, not yet paid)
		{12000000, 3250000, 0, 22, 21, model.PayrollProcessed},
		// Rina - Marketing Manager (paid)
		{20000000, 7000000, 0, 22, 22, model.PayrollPaid},
		// Fajar - Engineering Manager (paid)
		{25000000, 9000000, 288150, 22, 22, model.PayrollPaid},
		// Maya - HR Staff (draft - new employee)
		{8000000, 1750000, 0, 22, 20, model.PayrollDraft},
		// Rizky - Marketing Staff (draft - new employee)
		{8500000, 1750000, 0, 22, 22, model.PayrollDraft},
	}

	for i, p := range payrollData {
		kesEmp, _, jhtEmp, _, _, _, jpEmp, _ := calculator.CalculateBPJS(p.BasicSalary)
		bpjsKesDeduction := kesEmp
		bpjsTKDeduction := jhtEmp + jpEmp
		grossSalary := p.BasicSalary + p.TotalAllowances + p.OvertimePay

		// Simple PPh21 estimation (use TK/0 PTKP = 54,000,000)
		annualGross := grossSalary * 12
		pph21Monthly := calculator.CalculatePPh21Monthly(annualGross, 54000000)

		totalDeductions := bpjsKesDeduction + bpjsTKDeduction + pph21Monthly
		netSalary := grossSalary - totalDeductions

		payroll := model.Payroll{
			EmployeeID:       employees[i].ID,
			PeriodMonth:      1,
			PeriodYear:       2025,
			WorkingDays:      p.WorkingDays,
			PresentDays:      p.PresentDays,
			BasicSalary:      p.BasicSalary,
			TotalAllowances:  p.TotalAllowances,
			OvertimePay:      p.OvertimePay,
			THR:              0,
			TotalDeductions:  totalDeductions,
			BPJSKesDeduction: bpjsKesDeduction,
			BPJSTKDeduction:  bpjsTKDeduction,
			PPH21:            pph21Monthly,
			OtherDeductions:  0,
			GrossSalary:      grossSalary,
			NetSalary:        netSalary,
			Status:           p.Status,
			Notes:            fmt.Sprintf("Payroll Januari 2025 - %s", employees[i].EmployeeNumber),
		}

		if p.Status == model.PayrollPaid {
			payroll.PaidAt = &paidAt
		}

		if err := db.Create(&payroll).Error; err != nil {
			log.Printf("  ⚠ Payroll error for %s: %v", employees[i].EmployeeNumber, err)
		}
	}

	log.Printf("  ✓ %d payroll records seeded", len(payrollData))
}
