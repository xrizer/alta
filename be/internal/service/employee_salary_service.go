package service

import (
	"errors"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
	"hris-backend/pkg/calculator"
)

type EmployeeSalaryService interface {
	GetAll() ([]dto.EmployeeSalaryResponse, error)
	GetByID(id string) (*dto.EmployeeSalaryResponse, error)
	GetByEmployeeID(employeeID string) ([]dto.EmployeeSalaryResponse, error)
	GetLatestByEmployeeID(employeeID string) (*dto.EmployeeSalaryResponse, error)
	Create(req dto.CreateEmployeeSalaryRequest) (*dto.EmployeeSalaryResponse, error)
	Update(id string, req dto.UpdateEmployeeSalaryRequest) (*dto.EmployeeSalaryResponse, error)
	Delete(id string) error
}

type employeeSalaryService struct {
	salaryRepo repository.EmployeeSalaryRepository
	empRepo    repository.EmployeeRepository
}

func NewEmployeeSalaryService(salaryRepo repository.EmployeeSalaryRepository, empRepo repository.EmployeeRepository) EmployeeSalaryService {
	return &employeeSalaryService{
		salaryRepo: salaryRepo,
		empRepo:    empRepo,
	}
}

func (s *employeeSalaryService) GetAll() ([]dto.EmployeeSalaryResponse, error) {
	salaries, err := s.salaryRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToEmployeeSalaryResponses(salaries), nil
}

func (s *employeeSalaryService) GetByID(id string) (*dto.EmployeeSalaryResponse, error) {
	salary, err := s.salaryRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("employee salary not found")
	}
	response := dto.ToEmployeeSalaryResponse(salary)
	return &response, nil
}

func (s *employeeSalaryService) GetByEmployeeID(employeeID string) ([]dto.EmployeeSalaryResponse, error) {
	salaries, err := s.salaryRepo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}
	return dto.ToEmployeeSalaryResponses(salaries), nil
}

func (s *employeeSalaryService) GetLatestByEmployeeID(employeeID string) (*dto.EmployeeSalaryResponse, error) {
	salary, err := s.salaryRepo.FindLatestByEmployeeID(employeeID)
	if err != nil {
		return nil, errors.New("employee salary not found")
	}
	response := dto.ToEmployeeSalaryResponse(salary)
	return &response, nil
}

func (s *employeeSalaryService) Create(req dto.CreateEmployeeSalaryRequest) (*dto.EmployeeSalaryResponse, error) {
	// Validate employee exists
	_, err := s.empRepo.FindByID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	// Parse effective date
	effectiveDate, err := time.Parse("2006-01-02", req.EffectiveDate)
	if err != nil {
		return nil, errors.New("invalid effective date format, use YYYY-MM-DD")
	}

	// Auto-calculate BPJS contributions using the calculator
	bpjsKesEmp, bpjsKesCom, jhtEmp, jhtCom, jkk, jkm, jpEmp, jpCom := calculator.CalculateBPJS(req.BasicSalary)

	salary := &model.EmployeeSalary{
		EmployeeID:         req.EmployeeID,
		BasicSalary:        req.BasicSalary,
		TransportAllowance: req.TransportAllowance,
		MealAllowance:      req.MealAllowance,
		HousingAllowance:   req.HousingAllowance,
		PositionAllowance:  req.PositionAllowance,
		BPJSKesEmployee:    bpjsKesEmp,
		BPJSKesCompany:     bpjsKesCom,
		BPJSTKJHTEmployee:  jhtEmp,
		BPJSTKJHTCompany:   jhtCom,
		BPJSTKJKK:          jkk,
		BPJSTKJKM:          jkm,
		BPJSTKJPEmployee:   jpEmp,
		BPJSTKJPCompany:    jpCom,
		EffectiveDate:      effectiveDate,
	}

	if err := s.salaryRepo.Create(salary); err != nil {
		return nil, errors.New("failed to create employee salary")
	}

	response := dto.ToEmployeeSalaryResponse(salary)
	return &response, nil
}

func (s *employeeSalaryService) Update(id string, req dto.UpdateEmployeeSalaryRequest) (*dto.EmployeeSalaryResponse, error) {
	salary, err := s.salaryRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("employee salary not found")
	}

	recalcBPJS := false

	if req.BasicSalary != nil {
		salary.BasicSalary = *req.BasicSalary
		recalcBPJS = true
	}
	if req.TransportAllowance != nil {
		salary.TransportAllowance = *req.TransportAllowance
	}
	if req.MealAllowance != nil {
		salary.MealAllowance = *req.MealAllowance
	}
	if req.HousingAllowance != nil {
		salary.HousingAllowance = *req.HousingAllowance
	}
	if req.PositionAllowance != nil {
		salary.PositionAllowance = *req.PositionAllowance
	}
	if req.EffectiveDate != "" {
		ed, err := time.Parse("2006-01-02", req.EffectiveDate)
		if err != nil {
			return nil, errors.New("invalid effective date format, use YYYY-MM-DD")
		}
		salary.EffectiveDate = ed
	}

	// Recalculate BPJS if basic salary changed
	if recalcBPJS {
		bpjsKesEmp, bpjsKesCom, jhtEmp, jhtCom, jkk, jkm, jpEmp, jpCom := calculator.CalculateBPJS(salary.BasicSalary)
		salary.BPJSKesEmployee = bpjsKesEmp
		salary.BPJSKesCompany = bpjsKesCom
		salary.BPJSTKJHTEmployee = jhtEmp
		salary.BPJSTKJHTCompany = jhtCom
		salary.BPJSTKJKK = jkk
		salary.BPJSTKJKM = jkm
		salary.BPJSTKJPEmployee = jpEmp
		salary.BPJSTKJPCompany = jpCom
	}

	if err := s.salaryRepo.Update(salary); err != nil {
		return nil, errors.New("failed to update employee salary")
	}

	response := dto.ToEmployeeSalaryResponse(salary)
	return &response, nil
}

func (s *employeeSalaryService) Delete(id string) error {
	_, err := s.salaryRepo.FindByID(id)
	if err != nil {
		return errors.New("employee salary not found")
	}
	return s.salaryRepo.Delete(id)
}
