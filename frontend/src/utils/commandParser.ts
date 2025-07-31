import { Command, NewCommand, SearchCommand, AddGenCommand } from '../types';


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
  if (command === 'new') {
    // Get the arguments part (everything after 'new ')
    const args = content.slice(command.length).trim();
    return parseNewCommand(args);
  }

  // If no recognized command, treat as search
  return {
    type: 'search',
    query: content
  } as SearchCommand;
}

function parseNewCommand(args: string): NewCommand {
  // Split by semicolon
  const parts = args.split(';').map(part => part.trim());

  // For :new command, we only need serviceName, username, notes (no password)
  const serviceName = parts[0] || '';
  const username = parts[1] || '';
  const notes = parts[2] || '';

  return {
    type: 'new',
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

export function isValidNewCommand(command: NewCommand): boolean {
  return command.serviceName.length > 0 && 
         command.username.length > 0;
}

export function isValidAddGenCommand(command: AddGenCommand): boolean {
  return command.serviceName.length > 0 && 
         command.username.length > 0;
}

export function formatNewCommandExample(): string {
  return ':new service;username;notes';
}

export function formatAddGenCommandExample(): string {
  return ':addgen service;username;notes';
}
