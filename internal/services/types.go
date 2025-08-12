package services

type PasswordEntryResponse struct {
	ID          int    `json:"id"`
	ServiceName string `json:"serviceName"`
	Username    string `json:"username"`
	Notes       string `json:"notes"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type CreatePasswordRequest struct {
	ServiceName string `json:"serviceName"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	Notes       string `json:"notes"`
}