// TypeScript interfaces for the password manager
import { main } from '../wailsjs/go/models';

// Use the generated type from Wails
export type PasswordEntry = main.PasswordEntryResponse;

// Use the generated type from Wails
export type CreatePasswordRequest = main.CreatePasswordRequest;

export interface AppState {
  isLoggedIn: boolean;
  isInitialized: boolean;
}

// Command parsing types
export interface NewCommand {
  type: 'new';
  serviceName: string;
  username: string;
  password: string;
  notes: string;
}

export interface SearchCommand {
  type: 'search';
  query: string;
}

export type Command = NewCommand | SearchCommand;