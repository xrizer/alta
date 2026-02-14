package repository

import (
	"hris-backend/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MenuAccessRepository interface {
	FindByUserID(userID string) ([]model.MenuAccess, error)
	FindAllWithUsers() ([]model.MenuAccess, error)
	ReplaceForUser(userID string, menuKeys []string) error
	DeleteByUserID(userID string) error
}

type menuAccessRepository struct {
	db *gorm.DB
}

func NewMenuAccessRepository(db *gorm.DB) MenuAccessRepository {
	return &menuAccessRepository{db: db}
}

func (r *menuAccessRepository) FindByUserID(userID string) ([]model.MenuAccess, error) {
	var accesses []model.MenuAccess
	if err := r.db.Where("user_id = ?", userID).Find(&accesses).Error; err != nil {
		return nil, err
	}
	return accesses, nil
}

func (r *menuAccessRepository) FindAllWithUsers() ([]model.MenuAccess, error) {
	var accesses []model.MenuAccess
	if err := r.db.Preload("User").Order("user_id, menu_key").Find(&accesses).Error; err != nil {
		return nil, err
	}
	return accesses, nil
}

func (r *menuAccessRepository) ReplaceForUser(userID string, menuKeys []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete existing menu access for user
		if err := tx.Where("user_id = ?", userID).Delete(&model.MenuAccess{}).Error; err != nil {
			return err
		}

		// Insert new menu access records
		for _, key := range menuKeys {
			access := model.MenuAccess{
				ID:      uuid.New().String(),
				UserID:  userID,
				MenuKey: key,
			}
			if err := tx.Create(&access).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *menuAccessRepository) DeleteByUserID(userID string) error {
	return r.db.Where("user_id = ?", userID).Delete(&model.MenuAccess{}).Error
}
