import { Command, AddCommand, SearchCommand } from '../types';

export function parseCommand(input: string): Command {
  const trimmed = input.trim();
  
  // Check if it's an add command (starts with +)
  if (trimmed.startsWith('+')) {
    return parseAddCommand(trimmed);
  }
  
  // Otherwise it's a search command
  return {
    type: 'search',
    query: trimmed
  } as SearchCommand;
}

function parseAddCommand(input: string): AddCommand {
  // Remove the + prefix
  const content = input.slice(1);
  
  // Split by semicolon
  const parts = content.split(';').map(part => part.trim());
  
  // Ensure we have at least serviceName, username, and password
  const serviceName = parts[0] || '';
  const username = parts[1] || '';
  const password = parts[2] || '';
  const notes = parts[3] || '';
  
  return {
    type: 'add',
    serviceName,
    username,
    password,
    notes
  };
}

export function isValidAddCommand(command: AddCommand): boolean {
  return command.serviceName.length > 0 && 
         command.username.length > 0 && 
         command.password.length > 0;
}

export function formatAddCommandExample(): string {
  return '+service;username;password;notes';
}