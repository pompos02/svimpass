// TypeScript interfaces for the password manager
import { services } from "../wailsjs/go/models";

export type PasswordEntry = services.PasswordEntryResponse;

export interface PasswordEntryState {
    isActive: boolean;
    serviceName: string;
    username: string;
    notes: string;
    showPassword: boolean;
    editingId?: number;
}
