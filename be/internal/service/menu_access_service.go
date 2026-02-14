package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type MenuAccessService interface {
	GetUserMenuKeys(userID string) (*dto.UserMenuKeysResponse, error)
	GetAll() ([]dto.MenuAccessResponse, error)
	SetUserMenuAccess(req dto.SetMenuAccessRequest) error
	DeleteUserMenuAccess(userID string) error
}

type menuAccessService struct {
	menuRepo repository.MenuAccessRepository
	userRepo repository.UserRepository
}

func NewMenuAccessService(menuRepo repository.MenuAccessRepository, userRepo repository.UserRepository) MenuAccessService {
	return &menuAccessService{
		menuRepo: menuRepo,
		userRepo: userRepo,
	}
}

func (s *menuAccessService) GetUserMenuKeys(userID string) (*dto.UserMenuKeysResponse, error) {
	accesses, err := s.menuRepo.FindByUserID(userID)
	if err != nil {
		return nil, errors.New("failed to fetch menu access")
	}

	keys := make([]string, 0, len(accesses))
	for _, a := range accesses {
		keys = append(keys, a.MenuKey)
	}

	return &dto.UserMenuKeysResponse{MenuKeys: keys}, nil
}

func (s *menuAccessService) GetAll() ([]dto.MenuAccessResponse, error) {
	accesses, err := s.menuRepo.FindAllWithUsers()
	if err != nil {
		return nil, errors.New("failed to fetch menu access")
	}

	// Group by user_id
	grouped := make(map[string]*dto.MenuAccessResponse)
	userOrder := make([]string, 0)

	for _, a := range accesses {
		if _, exists := grouped[a.UserID]; !exists {
			resp := dto.ToMenuAccessResponse(a.UserID, &a.User, []string{})
			grouped[a.UserID] = &resp
			userOrder = append(userOrder, a.UserID)
		}
		grouped[a.UserID].MenuKeys = append(grouped[a.UserID].MenuKeys, a.MenuKey)
	}

	result := make([]dto.MenuAccessResponse, 0, len(grouped))
	for _, uid := range userOrder {
		result = append(result, *grouped[uid])
	}

	return result, nil
}

func (s *menuAccessService) SetUserMenuAccess(req dto.SetMenuAccessRequest) error {
	// Validate user exists
	_, err := s.userRepo.FindByID(req.UserID)
	if err != nil {
		return errors.New("user not found")
	}

	// Validate menu keys
	for _, key := range req.MenuKeys {
		if !model.ValidMenuKeys[key] {
			return errors.New("invalid menu key: " + key)
		}
	}

	return s.menuRepo.ReplaceForUser(req.UserID, req.MenuKeys)
}

func (s *menuAccessService) DeleteUserMenuAccess(userID string) error {
	return s.menuRepo.DeleteByUserID(userID)
}
