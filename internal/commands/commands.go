// Package commands handles all the userfacing commands of the application
package commands

import (
	"context"

	"svimpass/internal/services"
)

// AddCommand handles the :add command.
type AddCommand struct {
	PasswordService *services.PasswordService
	ServiceName     string
	Username        string
	Password        string
	Notes           string
}

func (c *AddCommand) Execute(ctx context.Context) (any, error) {
	req := services.CreatePasswordRequest{
		ServiceName: c.ServiceName,
		Username:    c.Username,
		Password:    c.Password,
		Notes:       c.Notes,
	}
	return nil, c.PasswordService.CreatePassword(req)
}

type AddGenCommand struct {
	PasswordService *services.PasswordService
	ServiceName     string
	Username        string
	Notes           string
}

func (c *AddGenCommand) Execute(ctx context.Context) (any, error) {
	req := services.CreatePasswordRequest{
		ServiceName: c.ServiceName,
		Username:    c.Username,
		Notes:       c.Notes,
	}

	return c.PasswordService.GenerateAndSavePassword(req)
}

type ImportCommand struct {
	PasswordService *services.PasswordService
	FilePath        string
}

func (c *ImportCommand) Execute(ctx context.Context) (any, error) {
	return c.PasswordService.ImportPasswordFromCSV(c.FilePath)
}

type ExportCommand struct {
	PasswordService *services.PasswordService
}

func (c *ExportCommand) Execute(ctx context.Context) (any, error) {
	return nil, c.PasswordService.ExportPasswordToCSV()
}
