package service

import (
	"errors"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

// MinVisitsPerDayDefault is the PT Ahmad Aris policy default: marketing
// employees are expected to log at least 5 visits per working day. It is a
// soft flag — admin sees under_minimum=true in the report but no action is
// forced on the employee.
const MinVisitsPerDayDefault = 5

type VisitPlanService interface {
	Create(userID string, req dto.CreateVisitPlanRequest) (*dto.VisitPlanResponse, error)
	Update(id string, req dto.UpdateVisitPlanRequest) (*dto.VisitPlanResponse, error)
	GetByID(id string) (*dto.VisitPlanResponse, error)
	GetByEmployeeAndDate(employeeID string, date time.Time) (*dto.VisitPlanResponse, error)
	ListByEmployee(employeeID string, from, to *time.Time) ([]dto.VisitPlanResponse, error)
	Delete(id string) error

	AddItem(planID string, req dto.AddVisitPlanItemRequest) (*dto.VisitPlanItemResponse, error)
	UpdateItem(id string, req dto.UpdateVisitPlanItemRequest) (*dto.VisitPlanItemResponse, error)
	DeleteItem(id string) error

	AdherenceReport(companyID string, date time.Time, minimum int) (*dto.VisitAdherenceReport, error)
}

type visitPlanService struct {
	repo      repository.VisitPlanRepository
	empRepo   repository.EmployeeRepository
	visitRepo repository.VisitRepository
}

func NewVisitPlanService(
	repo repository.VisitPlanRepository,
	empRepo repository.EmployeeRepository,
	visitRepo repository.VisitRepository,
) VisitPlanService {
	return &visitPlanService{repo, empRepo, visitRepo}
}

func (s *visitPlanService) Create(userID string, req dto.CreateVisitPlanRequest) (*dto.VisitPlanResponse, error) {
	planDate, err := time.Parse("2006-01-02", req.PlanDate)
	if err != nil {
		return nil, errors.New("invalid plan_date (YYYY-MM-DD)")
	}

	emp, err := s.empRepo.FindByID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	// Enforce one plan per (employee, date).
	if existing, _ := s.repo.FindByEmployeeAndDate(req.EmployeeID, planDate); existing != nil {
		return nil, errors.New("a plan already exists for this employee on this date")
	}

	status := req.Status
	if status == "" {
		status = "draft"
	}

	p := &model.VisitPlan{
		EmployeeID: req.EmployeeID,
		CompanyID:  emp.CompanyID,
		PlanDate:   planDate,
		Status:     status,
		Notes:      req.Notes,
		CreatedBy:  userID,
	}
	if err := s.repo.Create(p); err != nil {
		return nil, errors.New("failed to create plan")
	}

	for _, it := range req.Items {
		item := &model.VisitPlanItem{
			VisitPlanID:   p.ID,
			Location:      it.Location,
			SubLocation:   it.SubLocation,
			Purpose:       it.Purpose,
			ScheduledTime: it.ScheduledTime,
			SequenceOrder: it.SequenceOrder,
			Status:        "pending",
		}
		if err := s.repo.CreateItem(item); err != nil {
			return nil, errors.New("failed to create plan item")
		}
		p.Items = append(p.Items, *item)
	}

	resp := dto.ToVisitPlanResponse(p)
	return &resp, nil
}

func (s *visitPlanService) Update(id string, req dto.UpdateVisitPlanRequest) (*dto.VisitPlanResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("plan not found")
	}
	if req.Notes != nil {
		p.Notes = *req.Notes
	}
	if req.Status != nil {
		p.Status = *req.Status
	}
	if err := s.repo.Update(p); err != nil {
		return nil, errors.New("failed to update plan")
	}
	resp := dto.ToVisitPlanResponse(p)
	return &resp, nil
}

func (s *visitPlanService) GetByID(id string) (*dto.VisitPlanResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("plan not found")
	}
	resp := dto.ToVisitPlanResponse(p)
	return &resp, nil
}

func (s *visitPlanService) GetByEmployeeAndDate(employeeID string, date time.Time) (*dto.VisitPlanResponse, error) {
	p, err := s.repo.FindByEmployeeAndDate(employeeID, date)
	if err != nil {
		return nil, errors.New("plan not found")
	}
	resp := dto.ToVisitPlanResponse(p)
	return &resp, nil
}

func (s *visitPlanService) ListByEmployee(employeeID string, from, to *time.Time) ([]dto.VisitPlanResponse, error) {
	ps, err := s.repo.ListByEmployee(employeeID, from, to)
	if err != nil {
		return nil, err
	}
	return dto.ToVisitPlanResponses(ps), nil
}

func (s *visitPlanService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("plan not found")
	}
	return s.repo.Delete(id)
}

func (s *visitPlanService) AddItem(planID string, req dto.AddVisitPlanItemRequest) (*dto.VisitPlanItemResponse, error) {
	if _, err := s.repo.FindByID(planID); err != nil {
		return nil, errors.New("plan not found")
	}
	item := &model.VisitPlanItem{
		VisitPlanID:   planID,
		Location:      req.Location,
		SubLocation:   req.SubLocation,
		Purpose:       req.Purpose,
		ScheduledTime: req.ScheduledTime,
		SequenceOrder: req.SequenceOrder,
		Status:        "pending",
	}
	if err := s.repo.CreateItem(item); err != nil {
		return nil, errors.New("failed to add item")
	}
	resp := dto.ToVisitPlanItemResponse(item)
	return &resp, nil
}

func (s *visitPlanService) UpdateItem(id string, req dto.UpdateVisitPlanItemRequest) (*dto.VisitPlanItemResponse, error) {
	item, err := s.repo.FindItemByID(id)
	if err != nil {
		return nil, errors.New("item not found")
	}
	if req.Location != nil {
		item.Location = *req.Location
	}
	if req.SubLocation != nil {
		item.SubLocation = *req.SubLocation
	}
	if req.Purpose != nil {
		item.Purpose = *req.Purpose
	}
	if req.ScheduledTime != nil {
		item.ScheduledTime = req.ScheduledTime
	}
	if req.SequenceOrder != nil {
		item.SequenceOrder = *req.SequenceOrder
	}
	if req.Status != nil {
		item.Status = *req.Status
	}
	if err := s.repo.UpdateItem(item); err != nil {
		return nil, errors.New("failed to update item")
	}
	resp := dto.ToVisitPlanItemResponse(item)
	return &resp, nil
}

func (s *visitPlanService) DeleteItem(id string) error {
	if _, err := s.repo.FindItemByID(id); err != nil {
		return errors.New("item not found")
	}
	return s.repo.DeleteItem(id)
}

// AdherenceReport returns planned-vs-actual visit counts per employee for one
// date. It combines:
//   - Plans recorded for that (company, date) → planned count
//   - Actual visits in [date 00:00, date 23:59:59] → actual count
//   - Matched: actual visits whose VisitPlanItemID links back into the plan
//
// under_minimum flags employees whose actual_count is below `minimum`.
func (s *visitPlanService) AdherenceReport(companyID string, date time.Time, minimum int) (*dto.VisitAdherenceReport, error) {
	if minimum <= 0 {
		minimum = MinVisitsPerDayDefault
	}

	// 1. Plans for the day, keyed by employee.
	plans, err := s.repo.FindByCompanyAndDate(companyID, date)
	if err != nil {
		return nil, err
	}
	planByEmp := map[string]*model.VisitPlan{}
	for i := range plans {
		planByEmp[plans[i].EmployeeID] = &plans[i]
	}

	// 2. Actual visits for the day via the visits repo.
	from := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	to := from.Add(24*time.Hour - time.Second)
	visits, _, err := s.visitRepo.FindPaginated(1, 10000, "", companyID, &from, &to)
	if err != nil {
		return nil, err
	}

	type agg struct {
		actual  int
		matched int
	}
	visitAgg := map[string]*agg{}
	for _, v := range visits {
		a, ok := visitAgg[v.EmployeeID]
		if !ok {
			a = &agg{}
			visitAgg[v.EmployeeID] = a
		}
		a.actual++
		if v.VisitPlanItemID != "" {
			a.matched++
		}
	}

	// 3. Build union of employees (have plan or have visits).
	empIDs := map[string]struct{}{}
	for id := range planByEmp {
		empIDs[id] = struct{}{}
	}
	for id := range visitAgg {
		empIDs[id] = struct{}{}
	}

	rows := make([]dto.VisitAdherenceRow, 0, len(empIDs))
	for id := range empIDs {
		planned := 0
		if p := planByEmp[id]; p != nil {
			planned = len(p.Items)
		}
		actual := 0
		matched := 0
		if a := visitAgg[id]; a != nil {
			actual = a.actual
			matched = a.matched
		}
		name := ""
		if emp, err := s.empRepo.FindByID(id); err == nil && emp != nil {
			name = emp.User.Name
		}
		rows = append(rows, dto.VisitAdherenceRow{
			EmployeeID:    id,
			EmployeeName:  name,
			PlannedCount:  planned,
			ActualCount:   actual,
			MatchedCount:  matched,
			UnderMinimum:  actual < minimum,
			MinimumTarget: minimum,
		})
	}

	return &dto.VisitAdherenceReport{
		Date:    from,
		Minimum: minimum,
		Rows:    rows,
	}, nil
}
