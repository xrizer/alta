package service

import (
	"errors"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type EmployeeService interface {
	GetAll() ([]dto.EmployeeResponse, error)
	GetByID(id string) (*dto.EmployeeResponse, error)
	GetByUserID(userID string) (*dto.EmployeeResponse, error)
	GetByCompanyID(companyID string) ([]dto.EmployeeResponse, error)
	Create(req dto.CreateEmployeeRequest) (*dto.EmployeeResponse, error)
	Update(id string, req dto.UpdateEmployeeRequest) (*dto.EmployeeResponse, error)
	Delete(id string) error
}

type employeeService struct {
	empRepo      repository.EmployeeRepository
	userRepo     repository.UserRepository
	companyRepo  repository.CompanyRepository
	deptRepo     repository.DepartmentRepository
	posRepo      repository.PositionRepository
	shiftRepo    repository.ShiftRepository
	jobLevelRepo repository.JobLevelRepository
	gradeRepo    repository.GradeRepository
}

func NewEmployeeService(
	empRepo repository.EmployeeRepository,
	userRepo repository.UserRepository,
	companyRepo repository.CompanyRepository,
	deptRepo repository.DepartmentRepository,
	posRepo repository.PositionRepository,
	shiftRepo repository.ShiftRepository,
	jobLevelRepo repository.JobLevelRepository,
	gradeRepo repository.GradeRepository,
) EmployeeService {
	return &employeeService{
		empRepo:      empRepo,
		userRepo:     userRepo,
		companyRepo:  companyRepo,
		deptRepo:     deptRepo,
		posRepo:      posRepo,
		shiftRepo:    shiftRepo,
		jobLevelRepo: jobLevelRepo,
		gradeRepo:    gradeRepo,
	}
}

func (s *employeeService) GetAll() ([]dto.EmployeeResponse, error) {
	employees, err := s.empRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToEmployeeResponses(employees), nil
}

func (s *employeeService) GetByID(id string) (*dto.EmployeeResponse, error) {
	emp, err := s.empRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("employee not found")
	}
	response := dto.ToEmployeeResponse(emp)
	return &response, nil
}

func (s *employeeService) GetByUserID(userID string) (*dto.EmployeeResponse, error) {
	emp, err := s.empRepo.FindByUserID(userID)
	if err != nil {
		return nil, errors.New("employee not found")
	}
	response := dto.ToEmployeeResponse(emp)
	return &response, nil
}

func (s *employeeService) GetByCompanyID(companyID string) ([]dto.EmployeeResponse, error) {
	employees, err := s.empRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToEmployeeResponses(employees), nil
}

func (s *employeeService) Create(req dto.CreateEmployeeRequest) (*dto.EmployeeResponse, error) {
	// Validate user exists
	_, err := s.userRepo.FindByID(req.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Check if user already has an employee record
	existing, _ := s.empRepo.FindByUserID(req.UserID)
	if existing != nil {
		return nil, errors.New("user already has an employee record")
	}

	// Check employee number uniqueness
	existingEmp, _ := s.empRepo.FindByEmployeeNumber(req.EmployeeNumber)
	if existingEmp != nil {
		return nil, errors.New("employee number already exists")
	}

	// Validate company exists
	_, err = s.companyRepo.FindByID(req.CompanyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	// Validate department exists
	_, err = s.deptRepo.FindByID(req.DepartmentID)
	if err != nil {
		return nil, errors.New("department not found")
	}

	// Validate position exists
	_, err = s.posRepo.FindByID(req.PositionID)
	if err != nil {
		return nil, errors.New("position not found")
	}

	// Validate shift exists
	_, err = s.shiftRepo.FindByID(req.ShiftID)
	if err != nil {
		return nil, errors.New("shift not found")
	}

	// Validate job level if provided
	if req.JobLevelID != "" {
		_, err = s.jobLevelRepo.FindByID(req.JobLevelID)
		if err != nil {
			return nil, errors.New("job level not found")
		}
	}

	// Validate grade if provided
	if req.GradeID != "" {
		_, err = s.gradeRepo.FindByID(req.GradeID)
		if err != nil {
			return nil, errors.New("grade not found")
		}
	}

	// Parse join date
	joinDate, err := time.Parse("2006-01-02", req.JoinDate)
	if err != nil {
		return nil, errors.New("invalid join date format, use YYYY-MM-DD")
	}

	emp := &model.Employee{
		UserID:         req.UserID,
		CompanyID:      req.CompanyID,
		DepartmentID:   req.DepartmentID,
		PositionID:     req.PositionID,
		ShiftID:        req.ShiftID,
		EmployeeNumber: req.EmployeeNumber,
		NIK:            req.NIK,
		Gender:         req.Gender,
		BirthPlace:     req.BirthPlace,
		MaritalStatus:  req.MaritalStatus,
		Religion:       req.Religion,
		BloodType:      req.BloodType,
		LastEducation:  req.LastEducation,
		JoinDate:       joinDate,
		EmployeeStatus: req.EmployeeStatus,
		BankName:       req.BankName,
		BankAccount:    req.BankAccount,
		BPJSKesNo:      req.BPJSKesNo,
		BPJSTKNo:       req.BPJSTKNo,
		NPWP:           req.NPWP,
	}

	if req.EmployeeStatus == "" {
		emp.EmployeeStatus = model.StatusKontrak
	}

	if req.JobLevelID != "" {
		jlID := req.JobLevelID
		emp.JobLevelID = &jlID
	}
	if req.GradeID != "" {
		gID := req.GradeID
		emp.GradeID = &gID
	}

	// Parse optional birth date
	if req.BirthDate != "" {
		bd, err := time.Parse("2006-01-02", req.BirthDate)
		if err != nil {
			return nil, errors.New("invalid birth date format, use YYYY-MM-DD")
		}
		emp.BirthDate = &bd
	}

	// Parse optional contract start date
	if req.ContractStartDate != "" {
		csd, err := time.Parse("2006-01-02", req.ContractStartDate)
		if err != nil {
			return nil, errors.New("invalid contract start date format, use YYYY-MM-DD")
		}
		emp.ContractStartDate = &csd
	}

	// Parse optional contract end date
	if req.ContractEndDate != "" {
		ced, err := time.Parse("2006-01-02", req.ContractEndDate)
		if err != nil {
			return nil, errors.New("invalid contract end date format, use YYYY-MM-DD")
		}
		emp.ContractEndDate = &ced
	}

	// Validate contract dates if both provided
	if emp.ContractStartDate != nil && emp.ContractEndDate != nil {
		if emp.ContractEndDate.Before(*emp.ContractStartDate) {
			return nil, errors.New("contract end date must be after start date")
		}
	}

	if err := s.empRepo.Create(emp); err != nil {
		return nil, errors.New("failed to create employee")
	}

	// Reload with preloaded relations
	created, err := s.empRepo.FindByID(emp.ID)
	if err != nil {
		return nil, errors.New("failed to load employee")
	}

	response := dto.ToEmployeeResponse(created)
	return &response, nil
}

func (s *employeeService) Update(id string, req dto.UpdateEmployeeRequest) (*dto.EmployeeResponse, error) {
	emp, err := s.empRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	if req.DepartmentID != "" {
		_, err := s.deptRepo.FindByID(req.DepartmentID)
		if err != nil {
			return nil, errors.New("department not found")
		}
		emp.DepartmentID = req.DepartmentID
	}
	if req.PositionID != "" {
		_, err := s.posRepo.FindByID(req.PositionID)
		if err != nil {
			return nil, errors.New("position not found")
		}
		emp.PositionID = req.PositionID
	}
	if req.ShiftID != "" {
		_, err := s.shiftRepo.FindByID(req.ShiftID)
		if err != nil {
			return nil, errors.New("shift not found")
		}
		emp.ShiftID = req.ShiftID
	}
	if req.JobLevelID != "" {
		_, err := s.jobLevelRepo.FindByID(req.JobLevelID)
		if err != nil {
			return nil, errors.New("job level not found")
		}
		jlID := req.JobLevelID
		emp.JobLevelID = &jlID
	}
	if req.GradeID != "" {
		_, err := s.gradeRepo.FindByID(req.GradeID)
		if err != nil {
			return nil, errors.New("grade not found")
		}
		gID := req.GradeID
		emp.GradeID = &gID
	}
	if req.NIK != "" {
		emp.NIK = req.NIK
	}
	if req.Gender != "" {
		emp.Gender = req.Gender
	}
	if req.BirthPlace != "" {
		emp.BirthPlace = req.BirthPlace
	}
	if req.BirthDate != "" {
		bd, err := time.Parse("2006-01-02", req.BirthDate)
		if err != nil {
			return nil, errors.New("invalid birth date format, use YYYY-MM-DD")
		}
		emp.BirthDate = &bd
	}
	if req.MaritalStatus != "" {
		emp.MaritalStatus = req.MaritalStatus
	}
	if req.Religion != "" {
		emp.Religion = req.Religion
	}
	if req.BloodType != "" {
		emp.BloodType = req.BloodType
	}
	if req.LastEducation != "" {
		emp.LastEducation = req.LastEducation
	}
	if req.ContractStartDate != "" {
		csd, err := time.Parse("2006-01-02", req.ContractStartDate)
		if err != nil {
			return nil, errors.New("invalid contract start date format, use YYYY-MM-DD")
		}
		emp.ContractStartDate = &csd
	}
	if req.ContractEndDate != "" {
		ced, err := time.Parse("2006-01-02", req.ContractEndDate)
		if err != nil {
			return nil, errors.New("invalid contract end date format, use YYYY-MM-DD")
		}
		emp.ContractEndDate = &ced
	}
	// Validate contract dates if both present after update
	if emp.ContractStartDate != nil && emp.ContractEndDate != nil {
		if emp.ContractEndDate.Before(*emp.ContractStartDate) {
			return nil, errors.New("contract end date must be after start date")
		}
	}
	if req.ResignDate != "" {
		rd, err := time.Parse("2006-01-02", req.ResignDate)
		if err != nil {
			return nil, errors.New("invalid resign date format, use YYYY-MM-DD")
		}
		emp.ResignDate = &rd
	}
	if req.EmployeeStatus != "" {
		emp.EmployeeStatus = req.EmployeeStatus
	}
	if req.BankName != "" {
		emp.BankName = req.BankName
	}
	if req.BankAccount != "" {
		emp.BankAccount = req.BankAccount
	}
	if req.BPJSKesNo != "" {
		emp.BPJSKesNo = req.BPJSKesNo
	}
	if req.BPJSTKNo != "" {
		emp.BPJSTKNo = req.BPJSTKNo
	}
	if req.NPWP != "" {
		emp.NPWP = req.NPWP
	}

	if err := s.empRepo.Update(emp); err != nil {
		return nil, errors.New("failed to update employee")
	}

	// Reload with preloaded relations
	updated, err := s.empRepo.FindByID(emp.ID)
	if err != nil {
		return nil, errors.New("failed to load employee")
	}

	response := dto.ToEmployeeResponse(updated)
	return &response, nil
}

func (s *employeeService) Delete(id string) error {
	_, err := s.empRepo.FindByID(id)
	if err != nil {
		return errors.New("employee not found")
	}
	return s.empRepo.Delete(id)
}
