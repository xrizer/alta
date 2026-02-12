package dto

import "hris-backend/internal/model"

type CreateUserRequest struct {
	Name     string     `json:"name" validate:"required"`
	Email    string     `json:"email" validate:"required,email"`
	Password string     `json:"password" validate:"required,min=6"`
	Role     model.Role `json:"role" validate:"required,oneof=admin hr employee"`
	Phone    string     `json:"phone"`
	Address  string     `json:"address"`
}

type UpdateUserRequest struct {
	Name     string     `json:"name"`
	Email    string     `json:"email"`
	Password string     `json:"password"`
	Role     model.Role `json:"role"`
	Phone    string     `json:"phone"`
	Address  string     `json:"address"`
	IsActive *bool      `json:"is_active"`
}

type UserResponse struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Role      model.Role `json:"role"`
	Phone     string     `json:"phone"`
	Address   string     `json:"address"`
	IsActive  bool       `json:"is_active"`
	CreatedAt string     `json:"created_at"`
	UpdatedAt string     `json:"updated_at"`
}

func ToUserResponse(user *model.User) UserResponse {
	return UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		Phone:     user.Phone,
		Address:   user.Address,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func ToUserResponses(users []model.User) []UserResponse {
	responses := make([]UserResponse, len(users))
	for i, user := range users {
		responses[i] = ToUserResponse(&user)
	}
	return responses
}
