// TypeScript interfaces for the password manager
import { services } from '../wailsjs/go/models';

// Use the generated type from Wails
export type PasswordEntry = services.PasswordEntryResponse;

// Use the generated type from Wails
export type CreatePasswordRequest = services.CreatePasswordRequest;

export interface AppState {
  isLoggedIn: boolean;
  isInitialized: boolean;
}


export interface PasswordEntryState {
  isActive: boolean;
  serviceName: string;
  username: string;
  notes: string;
  showPassword: boolean;
}
