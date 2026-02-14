package dto

import "hris-backend/internal/model"

type SetMenuAccessRequest struct {
	UserID   string   `json:"user_id" validate:"required"`
	MenuKeys []string `json:"menu_keys" validate:"required"`
}

type MenuAccessResponse struct {
	UserID    string   `json:"user_id"`
	UserName  string   `json:"user_name"`
	UserEmail string   `json:"user_email"`
	UserRole  string   `json:"user_role"`
	MenuKeys  []string `json:"menu_keys"`
}

type UserMenuKeysResponse struct {
	MenuKeys []string `json:"menu_keys"`
}

func ToMenuAccessResponse(userID string, user *model.User, menuKeys []string) MenuAccessResponse {
	resp := MenuAccessResponse{
		UserID:   userID,
		MenuKeys: menuKeys,
	}
	if user != nil {
		resp.UserName = user.Name
		resp.UserEmail = user.Email
		resp.UserRole = string(user.Role)
	}
	return resp
}
