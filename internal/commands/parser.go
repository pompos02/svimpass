package commands

import (
	"fmt"
	"strings"

	"svimpass/internal/services"
)

// ParseCommand parses user input into executable commands
func ParseCommand(input string, passwordSvc *services.PasswordService) (Command, error) {
	input = strings.TrimSpace(input)

	// Remove the : prefix
	if !strings.HasPrefix(input, ":") {
		return nil, fmt.Errorf("put : in the start of your commands")
	}

	content := input[1:] // Remove ":"

	// Split by space to get command and arguments
	parts := strings.SplitN(content, " ", 2)
	command := strings.ToLower(parts[0])

	var args string
	if len(parts) > 1 {
		args = parts[1]
	}

	switch command {
	case "add":
		return parseAddCommand(args, passwordSvc)
	case "addgen":
		return parseAddGenCommand(args, passwordSvc)
	case "import":
		return parseImportCommand(args, passwordSvc)
	default:
		return nil, fmt.Errorf("unknown command: %s", command)
	}
}

func parseAddCommand(args string, passwordSvc *services.PasswordService) (Command, error) {
	// Split by semicolon - format: service;username;notes
	parts := strings.Split(args, ";")
	for i, part := range parts {
		parts[i] = strings.TrimSpace(part)
	}

	if len(parts) < 2 {
		return nil, fmt.Errorf("usage: :add service;username;notes")
	}

	serviceName := parts[0]
	username := parts[1]
	notes := ""
	if len(parts) > 2 {
		notes = parts[2]
	}

	if serviceName == "" || username == "" {
		return nil, fmt.Errorf("service name and username are required")
	}

	// Note: For :add command, the frontend doesn't seem to provide a password
	// This might need to be handled differently - maybe prompt for password?
	return &AddCommand{
		PasswordService: passwordSvc,
		ServiceName:     serviceName,
		Username:        username,
		Password:        "", // This might need special handling
		Notes:           notes,
	}, nil
}

func parseAddGenCommand(args string, passwordSvc *services.PasswordService) (Command, error) {
	// Split by semicolon - format: service;username;notes
	parts := strings.Split(args, ";")
	for i, part := range parts {
		parts[i] = strings.TrimSpace(part)
	}

	if len(parts) < 2 {
		return nil, fmt.Errorf("usage: :addgen service;username;notes")
	}

	serviceName := parts[0]
	username := parts[1]
	notes := ""
	if len(parts) > 2 {
		notes = parts[2]
	}

	if serviceName == "" || username == "" {
		return nil, fmt.Errorf("service name and username are required")
	}

	return &AddGenCommand{
		PasswordService: passwordSvc,
		ServiceName:     serviceName,
		Username:        username,
		Notes:           notes,
	}, nil
}

func parseImportCommand(args string, passwordSvc *services.PasswordService) (Command, error) {
	filepath := strings.TrimSpace(args)

	if filepath == "" {
		return nil, fmt.Errorf("usage: :import /path/to/file.csv")
	}

	return &ImportCommand{
		PasswordService: passwordSvc,
		FilePath:        filepath,
	}, nil
}
