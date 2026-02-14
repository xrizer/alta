package dto

import "hris-backend/internal/model"

type OrgEmployeeNode struct {
	ID             string `json:"id"`
	EmployeeNumber string `json:"employee_number"`
	UserName       string `json:"user_name"`
}

type OrgPositionNode struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Employees []OrgEmployeeNode `json:"employees"`
}

type OrgDepartmentNode struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Positions []OrgPositionNode `json:"positions"`
}

type OrgStructureResponse struct {
	CompanyID   string              `json:"company_id"`
	CompanyName string              `json:"company_name"`
	Departments []OrgDepartmentNode `json:"departments"`
}

func ToOrgStructureResponse(company *model.Company) OrgStructureResponse {
	resp := OrgStructureResponse{
		CompanyID:   company.ID,
		CompanyName: company.Name,
		Departments: make([]OrgDepartmentNode, 0),
	}

	for _, dept := range company.Departments {
		deptNode := OrgDepartmentNode{
			ID:        dept.ID,
			Name:      dept.Name,
			Positions: make([]OrgPositionNode, 0),
		}

		for _, pos := range dept.Positions {
			posNode := OrgPositionNode{
				ID:        pos.ID,
				Name:      pos.Name,
				Employees: make([]OrgEmployeeNode, 0),
			}

			for _, emp := range pos.Employees {
				empNode := OrgEmployeeNode{
					ID:             emp.ID,
					EmployeeNumber: emp.EmployeeNumber,
					UserName:       emp.User.Name,
				}
				posNode.Employees = append(posNode.Employees, empNode)
			}

			deptNode.Positions = append(deptNode.Positions, posNode)
		}

		resp.Departments = append(resp.Departments, deptNode)
	}

	return resp
}
