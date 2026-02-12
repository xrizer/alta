package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
	"hris-backend/pkg/hash"
)

type UserService interface {
	GetAll() ([]dto.UserResponse, error)
	GetByID(id string) (*dto.UserResponse, error)
	Create(req dto.CreateUserRequest) (*dto.UserResponse, error)
	Update(id string, req dto.UpdateUserRequest) (*dto.UserResponse, error)
	Delete(id string) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetAll() ([]dto.UserResponse, error) {
	users, err := s.userRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToUserResponses(users), nil
}

func (s *userService) GetByID(id string) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	response := dto.ToUserResponse(user)
	return &response, nil
}

func (s *userService) Create(req dto.CreateUserRequest) (*dto.UserResponse, error) {
	existing, _ := s.userRepo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email already exists")
	}

	hashedPassword, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &model.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     req.Role,
		Phone:    req.Phone,
		Address:  req.Address,
		IsActive: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	response := dto.ToUserResponse(user)
	return &response, nil
}

func (s *userService) Update(id string, req dto.UpdateUserRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		existing, _ := s.userRepo.FindByEmail(req.Email)
		if existing != nil && existing.ID != id {
			return nil, errors.New("email already exists")
		}
		user.Email = req.Email
	}
	if req.Password != "" {
		hashedPassword, err := hash.HashPassword(req.Password)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		user.Password = hashedPassword
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update user")
	}

	response := dto.ToUserResponse(user)
	return &response, nil
}

func (s *userService) Delete(id string) error {
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(id)
}
