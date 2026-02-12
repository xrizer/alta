package service

import (
	"errors"

	"hris-backend/config"
	"hris-backend/internal/dto"
	"hris-backend/internal/repository"
	"hris-backend/pkg/hash"
	jwtPkg "hris-backend/pkg/jwt"
)

type AuthService interface {
	Login(req dto.LoginRequest) (*dto.TokenResponse, string, error)
	RefreshToken(refreshToken string) (*dto.TokenResponse, string, error)
}

type authService struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
	return &authService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *authService) Login(req dto.LoginRequest) (*dto.TokenResponse, string, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	if !user.IsActive {
		return nil, "", errors.New("account is deactivated")
	}

	if !hash.CheckPassword(req.Password, user.Password) {
		return nil, "", errors.New("invalid email or password")
	}

	accessToken, err := jwtPkg.GenerateAccessToken(
		user.ID, user.Email, string(user.Role),
		s.cfg.JWTSecret, s.cfg.JWTAccessExpiry,
	)
	if err != nil {
		return nil, "", errors.New("failed to generate access token")
	}

	refreshToken, err := jwtPkg.GenerateRefreshToken(
		user.ID, s.cfg.JWTRefreshSecret, s.cfg.JWTRefreshExpiry,
	)
	if err != nil {
		return nil, "", errors.New("failed to generate refresh token")
	}

	return &dto.TokenResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresIn:   int(s.cfg.JWTAccessExpiry.Seconds()),
	}, refreshToken, nil
}

func (s *authService) RefreshToken(refreshToken string) (*dto.TokenResponse, string, error) {
	userID, err := jwtPkg.ValidateRefreshToken(refreshToken, s.cfg.JWTRefreshSecret)
	if err != nil {
		return nil, "", errors.New("invalid refresh token")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, "", errors.New("user not found")
	}

	if !user.IsActive {
		return nil, "", errors.New("account is deactivated")
	}

	accessToken, err := jwtPkg.GenerateAccessToken(
		user.ID, user.Email, string(user.Role),
		s.cfg.JWTSecret, s.cfg.JWTAccessExpiry,
	)
	if err != nil {
		return nil, "", errors.New("failed to generate access token")
	}

	newRefreshToken, err := jwtPkg.GenerateRefreshToken(
		user.ID, s.cfg.JWTRefreshSecret, s.cfg.JWTRefreshExpiry,
	)
	if err != nil {
		return nil, "", errors.New("failed to generate refresh token")
	}

	return &dto.TokenResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresIn:   int(s.cfg.JWTAccessExpiry.Seconds()),
	}, newRefreshToken, nil
}
