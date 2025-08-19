package main

import (
	"context"
	"fmt"

	"svimpass/internal/commands"
	"svimpass/internal/crypto"
	"svimpass/internal/database"
	"svimpass/internal/hotkey"
	"svimpass/internal/paths"
	"svimpass/internal/services"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	paths           *paths.Paths
	db              *database.DB
	authSvc         *services.AuthService
	passwordSvc     *services.PasswordService
	hotkeyManager   hotkey.HotkeyManager // Platform-specific hotkey manager
	isWindowVisible bool                 // Track window visibility state
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Initialize master password manager with new paths
	masterMgr, err := crypto.NewMasterPasswordManagerWithPaths(a.paths)
	if err != nil {
		fmt.Printf("Error initializing the Master Password: %v \n", err)
		return
	}

	// Initialize database with new paths
	db, err := database.NewDB(a.paths.Database())
	if err != nil {
		fmt.Printf("Error initializing the db : %v", err)
		return
	}
	a.db = db

	// Initialize services
	a.authSvc = services.NewAuthService(masterMgr)
	a.passwordSvc = services.NewPasswordService(db, a.authSvc)

	// Initialize platform-specific hotkey manager
	a.hotkeyManager = hotkey.NewManager()
	if err := a.hotkeyManager.Start(a.ToggleWindowVisibility); err != nil {
		fmt.Printf("Hotkey initialization failed: %v\n", err)
		fmt.Printf("Hotkey status: %s\n", a.hotkeyManager.GetDescription())
	} else {
		fmt.Printf("Hotkey manager started: %s\n", a.hotkeyManager.GetDescription())
	}
}

func (a *App) OnShutdown(ctx context.Context) {
	// Stop hotkey manager
	if a.hotkeyManager != nil {
		a.hotkeyManager.Stop()
	}

	// Close database
	if a.db != nil {
		a.db.Close()
	}
}

// onBeforeClose is called before the window closes
func (a *App) onBeforeClose(ctx context.Context) bool {
	// Return false to prevent window from closing (it will be hidden instead)
	return false
}

func (a *App) IsInitialized() bool {
	return a.authSvc.IsInitialized()
}

// SetupMasterPassword sets up the master password for first time
func (a *App) SetupMasterPassword(password, confirmPassword string) error {
	return a.authSvc.SetupMasterPassword(password, confirmPassword)
}

func (a *App) UnlockApp(password string) error {
	return a.authSvc.UnlockApp(password)
}

func (a *App) LockApp() {
	a.authSvc.LockApp()
}

// IsUnlocked returns true if the app is unlocked
func (a *App) IsUnlocked() bool {
	return a.authSvc.IsUnlocked()
}

func (a *App) ImportPasswordFromCSV(filepath string) (int, error) {
	return a.passwordSvc.ImportPasswordFromCSV(filepath)
}

func (a *App) SearchPasswords(query string) ([]services.PasswordEntryResponse, error) {
	return a.passwordSvc.SearchPasswords(query)
}

func (a *App) GeneratePassword() (string, error) {
	return a.passwordSvc.GeneratePassword()
}

func (a *App) GenerateAndSavePassword(req services.CreatePasswordRequest) (string, error) {
	return a.passwordSvc.GenerateAndSavePassword(req)
}

func (a *App) GetPassword(id int) (string, error) {
	return a.passwordSvc.GetPassword(id)
}

func (a *App) CreatePassword(req services.CreatePasswordRequest) error {
	return a.passwordSvc.CreatePassword(req)
}

func (a *App) DeletePassword(id int) error {
	return a.passwordSvc.DeletePassword(id)
}

func (a *App) UpdatePassword(id int, newpassword string) error {
	return a.passwordSvc.UpdatePasswordEntry(id, newpassword)
}

func (a *App) ToggleWindow() {
	if a.ctx == nil {
		fmt.Println("Context is nil in ToggleWindow!")
		return
	}

	fmt.Println("ToggleWindow called - current state:", a.isWindowVisible)

	// Toggle based on current window state
	if a.isWindowVisible {
		a.HideSpotlight()
	} else {
		a.ShowSpotlight()
	}
}

// ToggleWindowVisibility toggles the window visibility (used by global hotkey)
func (a *App) ToggleWindowVisibility() {
	a.ToggleWindow()
}

func (a *App) ShowSpotlight() {
	if a.ctx == nil {
		fmt.Println("Context is nil!")
		return
	}

	fmt.Println("Showing Spotlight window...")

	// Ensure window is not minimized first
	wailsruntime.WindowUnminimise(a.ctx)

	// Set to collapsed state initially (search input only)
	// Use same size for both login and main interface
	wailsruntime.WindowSetSize(a.ctx, 600, 50)

	// Center the window on screen
	wailsruntime.WindowCenter(a.ctx)

	// Show the window (this will bring it to front naturally)
	wailsruntime.WindowShow(a.ctx)

	// Update state
	a.isWindowVisible = true

	// Emit event to frontend to focus the search input
	wailsruntime.EventsEmit(a.ctx, "window-shown")

	fmt.Println("Window should be visible now")
}

func (a *App) HideSpotlight() {
	if a.ctx == nil {
		return
	}

	fmt.Println("Hiding Spotlight window...")

	// Hide the window
	wailsruntime.WindowHide(a.ctx)

	// Update state
	a.isWindowVisible = false

	fmt.Println("Window should be hidden now")
}

func (a *App) ExpandWindow(height int) {
	if a.ctx == nil {
		return
	}

	// Expand window height for results
	wailsruntime.WindowSetSize(a.ctx, 600, height)
}

// ResizeWindow resizes the window to the specified dimensions and centers it
func (a *App) ResizeWindow(width, height int) {
	if a.ctx == nil {
		return
	}

	wailsruntime.WindowSetSize(a.ctx, width, height)
	wailsruntime.WindowCenter(a.ctx)
}

// SetWindowCollapsed sets the window to collapsed state (search input only)
func (a *App) SetWindowCollapsed() {
	if a.ctx == nil {
		return
	}

	wailsruntime.WindowSetSize(a.ctx, 600, 50)
	wailsruntime.WindowCenter(a.ctx)
}

// SetWindowExpanded sets the window to expanded state (search input + dropdown)
func (a *App) SetWindowExpanded() {
	if a.ctx == nil {
		return
	}

	// Calculate exact height for seamless 4-entry display:
	// Input box: 50px + 4 entries × 60px + border: 1px + dropdown border: 1px = 292px
	wailsruntime.WindowSetSize(a.ctx, 600, 292)
	wailsruntime.WindowCenter(a.ctx)
}

// TestToggle - method to test the toggle functionality from frontend
func (a *App) TestToggle() {
	fmt.Println("TestToggle called from frontend")
	a.ToggleWindow()
}

// TestConnection - simple method to test frontend-backend communication
func (a *App) TestConnection() string {
	fmt.Println("TestConnection called from frontend")
	return "Backend connection working!"
}

// ExecuteCommand parses and executes user commands
func (a *App) ExecuteCommand(input string) (any, error) {
	cmd, err := commands.ParseCommand(input, a.passwordSvc, a.paths)
	if err != nil {
		return nil, err
	}
	return cmd.Execute(a.ctx)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
