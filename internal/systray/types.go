package systray

// TrayCallbacks defines the callback functions that the systray will invoke
type TrayCallbacks struct {
	ShowWindow func()
	HideWindow func()
	QuitApp    func()
}
