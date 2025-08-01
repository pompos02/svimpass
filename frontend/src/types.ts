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

export interface AddGenCommand {
  type: 'addgen';
  serviceName: string;
  username: string;
  notes: string;

}

export interface PasswordEntryState {
  isActive: boolean;
  serviceName: string;
  username: string;
  notes: string;
  showPassword: boolean;

}
// Command parsing types
export interface AddCommand {
  type: 'add';
  serviceName: string;
  username: string;
  notes: string;
}

export interface SearchCommand {
  type: 'search';
  query: string;
}

export type Command = AddGenCommand | AddCommand | SearchCommand;

export type InputMode = 'search' | 'command' | 'password';
