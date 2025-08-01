import { Command, AddCommand, SearchCommand, AddGenCommand, ImportCommand } from '../types';

export type InputMode = 'search' | 'command' | 'password';


export function parseCommand(input: string): Command {
  const trimmed = input.trim();

  // Check if it's a command mode (starts with :)
  if (trimmed.startsWith(':')) {
    return parseColonCommand(trimmed);
  }

  // Otherwise it's a search command
  return {
    type: 'search',
    query: trimmed
  } as SearchCommand;
}

function parseColonCommand(input: string): Command {
  // Remove the : prefix
  const content = input.slice(1);

  // Split by space to get command and arguments
  const parts = content.split(' ');
  const command = parts[0].toLowerCase();

  if (command === 'addgen') {
    const args = content.slice(6).trim(); // Remove 'addgen '
    return parseAddGenCommand(args);
  }
  if (command === 'add') {
    // Get the arguments part (everything after 'add ')
    const args = content.slice(command.length).trim();
    return parseAddCommand(args);
  }
  if (command === 'import') {
    const args = content.slice(6).trim(); // Remove 'import '
    return parseImportCommand(args);
  }

  // If no recognized command, treat as search
  return {
    type: 'search',
    query: content
  } as SearchCommand;
}

function parseAddCommand(args: string): AddCommand {
  // Split by semicolon
  const parts = args.split(';').map(part => part.trim());

  // For :add command, we only need serviceName, username, notes (no password)
  const serviceName = parts[0] || '';
  const username = parts[1] || '';
  const notes = parts[2] || '';

  return {
    type: 'add',
    serviceName,
    username,
    notes
  };
}

function parseAddGenCommand(args: string): AddGenCommand {
  // Split by semicolon
  const parts = args.split(';').map(part => part.trim());

  // For :addgen command, we need serviceName, username, notes (password auto-generated)
  const serviceName = parts[0] || '';
  const username = parts[1] || '';
  const notes = parts[2] || '';

  return {
    type: 'addgen',
    serviceName,
    username,
    notes
  };
}

export function isValidAddCommand(command: AddCommand): boolean {
  return command.serviceName.length > 0 && 
         command.username.length > 0;
}

export function isValidAddGenCommand(command: AddGenCommand): boolean {
  return command.serviceName.length > 0 && 
         command.username.length > 0;
}

export function formatAddCommandExample(): string {
  return ':add service;username;notes';
}

export function formatAddGenCommandExample(): string {
  return ':addgen service;username;notes';
}

function parseImportCommand(args: string): ImportCommand {
  return {
    type: 'import',
    filename: args.trim()
  };
}

export function isValidImportCommand(command: ImportCommand): boolean {
  return command.filename.length > 0 && 
         (command.filename.startsWith('/') || !!command.filename.match(/^[A-Za-z]:\\/)); // Unix or Windows absolute paths
}

export function formatImportCommandExample(): string {
  return ':import /absolute/path/to/passwords.csv';
}

export function getCurrentMode(input: string): InputMode {
  const trimmed = input.trim();
  return trimmed.startsWith(':') ? 'command' : 'search';
}

export function isCommandMode(input: string): boolean {
  return getCurrentMode(input) === 'command';
}

export function isSearchMode(input: string): boolean {
  return getCurrentMode(input) === 'search';
}
