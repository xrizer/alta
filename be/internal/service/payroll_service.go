package service

import (
	"errors"
	"math"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
	"hris-backend/pkg/calculator"
)

type PayrollService interface {
	GetAll() ([]dto.PayrollResponse, error)
	GetByID(id string) (*dto.PayrollResponse, error)
	GetByEmployeeID(employeeID string) ([]dto.PayrollResponse, error)
	GetByPeriod(month, year int) ([]dto.PayrollResponse, error)
	GetPaidByEmployeeID(employeeID string) ([]dto.PayrollResponse, error)
	Generate(req dto.GeneratePayrollRequest) (*dto.PayrollResponse, error)
	Update(id string, req dto.UpdatePayrollRequest) (*dto.PayrollResponse, error)
	UpdateStatus(id string, req dto.PayrollStatusRequest) (*dto.PayrollResponse, error)
	Delete(id string) error
}

type payrollService struct {
	payrollRepo repository.PayrollRepository
	empRepo     repository.EmployeeRepository
	salaryRepo  repository.EmployeeSalaryRepository
	attRepo     repository.AttendanceRepository
}

func NewPayrollService(
	payrollRepo repository.PayrollRepository,
	empRepo repository.EmployeeRepository,
	salaryRepo repository.EmployeeSalaryRepository,
	attRepo repository.AttendanceRepository,
) PayrollService {
	return &payrollService{
		payrollRepo: payrollRepo,
		empRepo:     empRepo,
		salaryRepo:  salaryRepo,
		attRepo:     attRepo,
	}
}

func (s *payrollService) GetAll() ([]dto.PayrollResponse, error) {
	payrolls, err := s.payrollRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToPayrollResponses(payrolls), nil
}

func (s *payrollService) GetByID(id string) (*dto.PayrollResponse, error) {
	payroll, err := s.payrollRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("payroll not found")
	}
	response := dto.ToPayrollResponse(payroll)
	return &response, nil
}

func (s *payrollService) GetByEmployeeID(employeeID string) ([]dto.PayrollResponse, error) {
	payrolls, err := s.payrollRepo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}
	return dto.ToPayrollResponses(payrolls), nil
}

func (s *payrollService) GetByPeriod(month, year int) ([]dto.PayrollResponse, error) {
	payrolls, err := s.payrollRepo.FindByPeriod(month, year)
	if err != nil {
		return nil, err
	}
	return dto.ToPayrollResponses(payrolls), nil
}

func (s *payrollService) GetPaidByEmployeeID(employeeID string) ([]dto.PayrollResponse, error) {
	payrolls, err := s.payrollRepo.FindPaidByEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}
	return dto.ToPayrollResponses(payrolls), nil
}

func (s *payrollService) Generate(req dto.GeneratePayrollRequest) (*dto.PayrollResponse, error) {
	// Validate employee
	emp, err := s.empRepo.FindByID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	// Check for duplicate payroll
	existing, _ := s.payrollRepo.FindByEmployeeIDAndPeriod(req.EmployeeID, req.Month, req.Year)
	if existing != nil {
		return nil, errors.New("payroll already exists for this period")
	}

	// Get latest salary
	salary, err := s.salaryRepo.FindLatestByEmployeeID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee salary not found, please set salary first")
	}

	// Get attendance for the month
	attendances, err := s.attRepo.FindByEmployeeIDAndMonth(req.EmployeeID, req.Month, req.Year)
	if err != nil {
		return nil, errors.New("failed to fetch attendance data")
	}

	// Calculate working days and present days
	workingDays := calculateWorkingDays(req.Month, req.Year)
	presentDays := 0
	totalOvertimeHours := 0.0
	for _, att := range attendances {
		if att.Status == model.AttendanceHadir || att.Status == model.AttendanceTerlambat {
			presentDays++
		}
		totalOvertimeHours += att.OvertimeHours
	}

	// Calculate salary components
	basicSalary := salary.BasicSalary
	totalAllowances := salary.TransportAllowance + salary.MealAllowance + salary.HousingAllowance + salary.PositionAllowance

	// Calculate overtime pay using calculator
	overtimePay := calculator.CalculateOvertime(basicSalary, totalOvertimeHours, false)

	// Gross salary
	grossSalary := basicSalary + totalAllowances + overtimePay

	// BPJS deductions (employee portion)
	bpjsKesEmployee := salary.BPJSKesEmployee
	bpjsTKEmployee := salary.BPJSTKJHTEmployee + salary.BPJSTKJPEmployee

	// Calculate PPh21
	annualGross := grossSalary * 12
	ptkp := calculator.GetPTKP(emp.MaritalStatus, 0)
	pph21 := calculator.CalculatePPh21Monthly(annualGross, ptkp)

	// Total deductions
	totalDeductions := bpjsKesEmployee + bpjsTKEmployee + pph21

	// Net salary
	netSalary := grossSalary - totalDeductions

	payroll := &model.Payroll{
		EmployeeID:       req.EmployeeID,
		PeriodMonth:      req.Month,
		PeriodYear:       req.Year,
		WorkingDays:      workingDays,
		PresentDays:      presentDays,
		BasicSalary:      basicSalary,
		TotalAllowances:  totalAllowances,
		OvertimePay:      overtimePay,
		GrossSalary:      grossSalary,
		BPJSKesDeduction: bpjsKesEmployee,
		BPJSTKDeduction:  bpjsTKEmployee,
		PPH21:            pph21,
		TotalDeductions:  totalDeductions,
		NetSalary:        netSalary,
		Status:           model.PayrollDraft,
	}

	// Round all monetary values
	payroll.GrossSalary = math.Round(payroll.GrossSalary)
	payroll.TotalDeductions = math.Round(payroll.TotalDeductions)
	payroll.NetSalary = math.Round(payroll.NetSalary)

	if err := s.payrollRepo.Create(payroll); err != nil {
		return nil, errors.New("failed to generate payroll")
	}

	created, err := s.payrollRepo.FindByID(payroll.ID)
	if err != nil {
		return nil, errors.New("failed to load payroll")
	}

	response := dto.ToPayrollResponse(created)
	return &response, nil
}

func (s *payrollService) Update(id string, req dto.UpdatePayrollRequest) (*dto.PayrollResponse, error) {
	payroll, err := s.payrollRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("payroll not found")
	}

	if payroll.Status == model.PayrollPaid {
		return nil, errors.New("cannot update paid payroll")
	}

	if req.OvertimePay != nil {
		payroll.OvertimePay = *req.OvertimePay
	}
	if req.THR != nil {
		payroll.THR = *req.THR
	}
	if req.OtherDeductions != nil {
		payroll.OtherDeductions = *req.OtherDeductions
	}
	if req.Notes != "" {
		payroll.Notes = req.Notes
	}

	// Recalculate gross and net
	payroll.GrossSalary = payroll.BasicSalary + payroll.TotalAllowances + payroll.OvertimePay + payroll.THR
	payroll.TotalDeductions = payroll.BPJSKesDeduction + payroll.BPJSTKDeduction + payroll.PPH21 + payroll.OtherDeductions
	payroll.NetSalary = payroll.GrossSalary - payroll.TotalDeductions

	payroll.GrossSalary = math.Round(payroll.GrossSalary)
	payroll.TotalDeductions = math.Round(payroll.TotalDeductions)
	payroll.NetSalary = math.Round(payroll.NetSalary)

	if err := s.payrollRepo.Update(payroll); err != nil {
		return nil, errors.New("failed to update payroll")
	}

	response := dto.ToPayrollResponse(payroll)
	return &response, nil
}

func (s *payrollService) UpdateStatus(id string, req dto.PayrollStatusRequest) (*dto.PayrollResponse, error) {
	payroll, err := s.payrollRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("payroll not found")
	}

	// Validate status transitions: draft -> processed -> paid
	switch payroll.Status {
	case model.PayrollDraft:
		if req.Status != model.PayrollProcessed {
			return nil, errors.New("draft payroll can only be moved to processed")
		}
	case model.PayrollProcessed:
		if req.Status != model.PayrollPaid {
			return nil, errors.New("processed payroll can only be moved to paid")
		}
	case model.PayrollPaid:
		return nil, errors.New("paid payroll status cannot be changed")
	}

	payroll.Status = req.Status
	if req.Status == model.PayrollPaid {
		now := time.Now()
		payroll.PaidAt = &now
	}

	if err := s.payrollRepo.Update(payroll); err != nil {
		return nil, errors.New("failed to update payroll status")
	}

	// Reload
	updated, err := s.payrollRepo.FindByID(payroll.ID)
	if err != nil {
		return nil, errors.New("failed to load payroll")
	}

	response := dto.ToPayrollResponse(updated)
	return &response, nil
}

func (s *payrollService) Delete(id string) error {
	payroll, err := s.payrollRepo.FindByID(id)
	if err != nil {
		return errors.New("payroll not found")
	}

	if payroll.Status != model.PayrollDraft {
		return errors.New("can only delete draft payroll")
	}

	return s.payrollRepo.Delete(id)
}

// calculateWorkingDays returns approximate working days (weekdays) in a month
func calculateWorkingDays(month, year int) int {
	firstDay := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	lastDay := firstDay.AddDate(0, 1, -1)

	workingDays := 0
	for d := firstDay; !d.After(lastDay); d = d.AddDate(0, 0, 1) {
		if d.Weekday() != time.Saturday && d.Weekday() != time.Sunday {
			workingDays++
		}
	}
	return workingDays
}

// calculateMonthsWorked returns total months worked from join date until now
func calculateMonthsWorked(joinDate time.Time) int {
	now := time.Now()
	months := (now.Year()-joinDate.Year())*12 + int(now.Month()) - int(joinDate.Month())
	if months < 0 {
		return 0
	}
	return months
}
