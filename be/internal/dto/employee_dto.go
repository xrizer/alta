package dto

import (
	"hris-backend/internal/model"
)

type CreateEmployeeRequest struct {
	UserID         string               `json:"user_id" validate:"required"`
	CompanyID      string               `json:"company_id" validate:"required"`
	DepartmentID   string               `json:"department_id" validate:"required"`
	PositionID     string               `json:"position_id" validate:"required"`
	ShiftID        string               `json:"shift_id" validate:"required"`
	EmployeeNumber string               `json:"employee_number" validate:"required"`
	NIK            string               `json:"nik"`
	Gender         string               `json:"gender"`
	BirthPlace     string               `json:"birth_place"`
	BirthDate      string               `json:"birth_date"`
	MaritalStatus  string               `json:"marital_status"`
	Religion       string               `json:"religion"`
	BloodType      string               `json:"blood_type"`
	LastEducation  string               `json:"last_education"`
	JoinDate       string               `json:"join_date" validate:"required"`
	EmployeeStatus model.EmployeeStatus `json:"employee_status"`
	BankName       string               `json:"bank_name"`
	BankAccount    string               `json:"bank_account"`
	BPJSKesNo      string               `json:"bpjs_kes_no"`
	BPJSTKNo       string               `json:"bpjs_tk_no"`
	NPWP           string               `json:"npwp"`
}

type UpdateEmployeeRequest struct {
	DepartmentID   string               `json:"department_id"`
	PositionID     string               `json:"position_id"`
	ShiftID        string               `json:"shift_id"`
	NIK            string               `json:"nik"`
	Gender         string               `json:"gender"`
	BirthPlace     string               `json:"birth_place"`
	BirthDate      string               `json:"birth_date"`
	MaritalStatus  string               `json:"marital_status"`
	Religion       string               `json:"religion"`
	BloodType      string               `json:"blood_type"`
	LastEducation  string               `json:"last_education"`
	ResignDate     string               `json:"resign_date"`
	EmployeeStatus model.EmployeeStatus `json:"employee_status"`
	BankName       string               `json:"bank_name"`
	BankAccount    string               `json:"bank_account"`
	BPJSKesNo      string               `json:"bpjs_kes_no"`
	BPJSTKNo       string               `json:"bpjs_tk_no"`
	NPWP           string               `json:"npwp"`
}

type EmployeeResponse struct {
	ID             string               `json:"id"`
	UserID         string               `json:"user_id"`
	User           *UserResponse        `json:"user,omitempty"`
	CompanyID      string               `json:"company_id"`
	Company        *CompanyResponse     `json:"company,omitempty"`
	DepartmentID   string               `json:"department_id"`
	Department     *DepartmentResponse  `json:"department,omitempty"`
	PositionID     string               `json:"position_id"`
	Position       *PositionResponse    `json:"position,omitempty"`
	ShiftID        string               `json:"shift_id"`
	Shift          *ShiftResponse       `json:"shift,omitempty"`
	EmployeeNumber string               `json:"employee_number"`
	NIK            string               `json:"nik"`
	Gender         string               `json:"gender"`
	BirthPlace     string               `json:"birth_place"`
	BirthDate      string               `json:"birth_date"`
	MaritalStatus  string               `json:"marital_status"`
	Religion       string               `json:"religion"`
	BloodType      string               `json:"blood_type"`
	LastEducation  string               `json:"last_education"`
	JoinDate       string               `json:"join_date"`
	ResignDate     string               `json:"resign_date"`
	EmployeeStatus model.EmployeeStatus `json:"employee_status"`
	BankName       string               `json:"bank_name"`
	BankAccount    string               `json:"bank_account"`
	BPJSKesNo      string               `json:"bpjs_kes_no"`
	BPJSTKNo       string               `json:"bpjs_tk_no"`
	NPWP           string               `json:"npwp"`
	CreatedAt      string               `json:"created_at"`
	UpdatedAt      string               `json:"updated_at"`
}

func ToEmployeeResponse(emp *model.Employee) EmployeeResponse {
	resp := EmployeeResponse{
		ID:             emp.ID,
		UserID:         emp.UserID,
		CompanyID:      emp.CompanyID,
		DepartmentID:   emp.DepartmentID,
		PositionID:     emp.PositionID,
		ShiftID:        emp.ShiftID,
		EmployeeNumber: emp.EmployeeNumber,
		NIK:            emp.NIK,
		Gender:         emp.Gender,
		BirthPlace:     emp.BirthPlace,
		MaritalStatus:  emp.MaritalStatus,
		Religion:       emp.Religion,
		BloodType:      emp.BloodType,
		LastEducation:  emp.LastEducation,
		JoinDate:       emp.JoinDate.Format("2006-01-02"),
		EmployeeStatus: emp.EmployeeStatus,
		BankName:       emp.BankName,
		BankAccount:    emp.BankAccount,
		BPJSKesNo:      emp.BPJSKesNo,
		BPJSTKNo:       emp.BPJSTKNo,
		NPWP:           emp.NPWP,
		CreatedAt:      emp.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:      emp.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if emp.BirthDate != nil {
		resp.BirthDate = emp.BirthDate.Format("2006-01-02")
	}
	if emp.ResignDate != nil {
		resp.ResignDate = emp.ResignDate.Format("2006-01-02")
	}

	if emp.User.ID != "" {
		userResp := ToUserResponse(&emp.User)
		resp.User = &userResp
	}
	if emp.Company.ID != "" {
		companyResp := ToCompanyResponse(&emp.Company)
		resp.Company = &companyResp
	}
	if emp.Department.ID != "" {
		deptResp := ToDepartmentResponse(&emp.Department)
		resp.Department = &deptResp
	}
	if emp.Position.ID != "" {
		posResp := ToPositionResponse(&emp.Position)
		resp.Position = &posResp
	}
	if emp.Shift.ID != "" {
		shiftResp := ToShiftResponse(&emp.Shift)
		resp.Shift = &shiftResp
	}

	return resp
}

func ToEmployeeResponses(employees []model.Employee) []EmployeeResponse {
	responses := make([]EmployeeResponse, len(employees))
	for i, emp := range employees {
		responses[i] = ToEmployeeResponse(&emp)
	}
	return responses
}
