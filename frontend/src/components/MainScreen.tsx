import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    SearchPasswords,
    CreatePassword,
    DeletePassword,
    GetPassword,
    LockApp,
    ExecuteCommand,
    HideSpotlight,
    SetWindowCollapsed,
    SetWindowExpanded,
    UpdatePassword,
} from "../../wailsjs/go/main/App";
import { PasswordEntry, PasswordEntryState } from "../types";
import { services } from "../../wailsjs/go/models";
import { useSimpleNavigation } from "../hooks/useSimpleNavigation";
import PasswordDropdown from "./PasswordDropdown";
import { EventsOn } from "../../wailsjs/runtime/runtime";

const { CreatePasswordRequest } = services;

// Help commands data - formatted like PasswordEntry for component reuse
const HELP_COMMANDS: PasswordEntry[] = [
    {
        id: 1,
        serviceName: ":add service;username;notes",
        username: "Add new password entry",
        notes: "Creates a new password entry with specified details",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 2,
        serviceName: ":addgen service;username;notes",
        username: "Add with generated password",
        notes: "Creates entry with auto-generated secure password",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 3,
        serviceName: ":import /path/to/file.csv",
        username: "Import passwords from CSV",
        notes: "Import passwords from CSV file with absolute path",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 4,
        serviceName: ":export",
        username: "Export all passwords",
        notes: "Export all passwords to CSV file",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 5,
        serviceName: "Ctrl+L",
        username: "Lock application",
        notes: "Lock the application and return to login screen",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 6,
        serviceName: "Ctrl+D",
        username: "Delete selected entry",
        notes: "Delete the currently selected password entry",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 7,
        serviceName: "Ctrl+E",
        username: "Edit selected entry",
        notes: "Edit the currently selected password entry",
        createdAt: "",
        updatedAt: "",
    },
    {
        id: 8,
        serviceName: ":reset!",
        username: "Reset application data",
        notes: "Clear all passwords and reset application (requires restart)",
        createdAt: "",
        updatedAt: "",
    },
];

interface MainScreenProps {
    onLogout: () => void;
}

export default function MainScreen({ onLogout }: MainScreenProps) {
    const [input, setInput] = useState("");
    const [results, setResults] = useState<PasswordEntry[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState("");
    const [isShowingMessage, setIsShowingMessage] = useState(false);
    const [currentWindowState, setCurrentWindowState] = useState<'collapsed' | 'expanded'>('collapsed');
    const [passwordEntryState, setPasswordEntryState] =
        useState<PasswordEntryState>({
            isActive: false,
            serviceName: "",
            username: "",
            notes: "",
            showPassword: false,
            editingId: undefined,
        });

    // Simple mode detection
    const isCommandMode = () => input.trim().startsWith(":");
    const isHelpMode = () => input.trim() === ":help";
    const isSearchMode = () => !passwordEntryState.isActive && !isCommandMode();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCopyPassword = async (id: number) => {
        try {
            const password = await GetPassword(id);
            await navigator.clipboard.writeText(password);

            // Clear UI state
            setInput("");
            setShowDropdown(false);
            navigation.reset();

            // Instantly hide window after copying password (true Spotlight behavior)
            try {
                await HideSpotlight();
            } catch (error) {
                console.error("Failed to hide window after copy:", error);
            }
        } catch (error) {
            showMessage("Failed to copy password");
            console.error("Copy password failed:", error);
        }
    };

    // Simple navigation hook
    const navigation = useSimpleNavigation({
        items: results,
        isOpen: showDropdown,
        onSelect: (item) => handleCopyPassword(item.id),
    });

    useEffect(() => {
        // Auto-focus on the input field
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Listen for window-shown event from backend
        const cleanup = EventsOn("window-shown", () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        });

        return cleanup;
    }, []);

    useEffect(() => {
        // Don't update placeholder if we're showing an error/success message
        if (isShowingMessage) return;

        // Update placeholder based on current state
        if (passwordEntryState.isActive) {
            if (passwordEntryState.editingId) {
                setPlaceholder(
                    `Enter new password for ${passwordEntryState.serviceName}...`,
                );
            } else {
                setPlaceholder(
                    `Enter password for ${passwordEntryState.serviceName}...`,
                );
            }
        } else if (input.startsWith(":import")) {
            setPlaceholder(":import /absolute/path/to/passwords.csv");
        } else if (input.startsWith(":addgen")) {
            setPlaceholder(":addgen service;username;notes");
        } else if (input.startsWith(":add")) {
            setPlaceholder(":add service;username;notes");
        } else if (input.startsWith(":help")) {
            setPlaceholder("Select a command from the help list below");
        } else {
            setPlaceholder("Search or :help");
        }
    }, [
        passwordEntryState.isActive,
        passwordEntryState.editingId,
        passwordEntryState.serviceName,
        input,
        isShowingMessage,
    ]);

    // Helper function to show error messages
    const showMessage = (message: string) => {
        setIsShowingMessage(true);
        setPlaceholder(message);
        setInput("");
        setTimeout(() => {
            setIsShowingMessage(false);
            // This will trigger the useEffect to set the appropriate placeholder
        }, 2000);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    };

    // Helper function to show success messages that don't clear input (used before window operations)
    const showSuccessMessage = (message: string) => {
        setIsShowingMessage(true);
        setPlaceholder(message);
        setTimeout(() => {
            setIsShowingMessage(false);
        }, 2000);
    };

    // Helper function for password entry mode errors (restores to password entry placeholder)
    const showPasswordEntryError = (message: string) => {
        setIsShowingMessage(true);
        setPlaceholder(message);
        setInput("");
        setTimeout(() => {
            setIsShowingMessage(false);
            // This will trigger the useEffect to set the password entry placeholder
        }, 2000);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    };

    useEffect(() => {
        // Auto-focus when entering password entry mode (add or edit)
        if (passwordEntryState.isActive && inputRef.current) {
            // Use setTimeout to ensure the input is rendered before focusing
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [passwordEntryState.isActive]);

    // Helper function to conditionally resize window only when state changes
    const conditionalWindowResize = async (shouldExpand: boolean) => {
        const targetState = shouldExpand ? 'expanded' : 'collapsed';
        
        if (currentWindowState !== targetState) {
            try {
                if (shouldExpand) {
                    await SetWindowExpanded();
                } else {
                    await SetWindowCollapsed();
                }
                setCurrentWindowState(targetState);
            } catch (error) {
                console.error("Failed to resize window:", error);
            }
        }
    };

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        // If in password entry mode, don't perform any search operations
        if (passwordEntryState.isActive) {
            return;
        }

        // Use the new value for mode detection, not the stale input state
        const isCurrentCommandMode = value.trim().startsWith(":");
        const isCurrentHelpMode = value.trim() === ":help";
        const isCurrentSearchMode =
            !passwordEntryState.isActive && !isCurrentCommandMode;

        if (value.trim() === "") {
            setShowDropdown(false);
            setResults([]);
            navigation.reset();
            // Collapse window when no input
            await conditionalWindowResize(false);
            return;
        }

        // Handle help mode - show help commands
        if (isCurrentHelpMode) {
            setResults(HELP_COMMANDS);
            setShowDropdown(true);
            navigation.reset();
            // Expand window to show help
            await conditionalWindowResize(true);
            return;
        }

        // Only perform search if in search mode
        if (isCurrentSearchMode && value.trim()) {
            try {
                setIsLoading(true);
                const searchResults = await SearchPasswords(value.trim());
                setResults(searchResults || []);
                const hasResults = searchResults && searchResults.length > 0;
                setShowDropdown(hasResults);

                // Resize window based on results
                await conditionalWindowResize(hasResults);

                // Don't reset navigation here - let user continue with existing selection
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
                setShowDropdown(false);
                navigation.reset();
                // Collapse window on error
                await conditionalWindowResize(false);
            } finally {
                setIsLoading(false);
            }
        } else if (isCurrentCommandMode) {
            // Command mode - hide dropdown and clear results immediately
            setShowDropdown(false);
            setResults([]);
            navigation.reset();
            // Collapse window in command mode
            await conditionalWindowResize(false);
        }
    };

    const handleSubmit = useCallback(async () => {
        // Handle password entry mode submission
        if (passwordEntryState.isActive) {
            if (input.trim() === "") return;

            try {
                setIsLoading(true);

                if (passwordEntryState.editingId) {
                    // Edit existing password
                    await UpdatePassword(passwordEntryState.editingId, input);
                    showSuccessMessage(`Updated ${passwordEntryState.serviceName}`);
                } else {
                    // Create new password (existing logic)
                    const request = new CreatePasswordRequest({
                        serviceName: passwordEntryState.serviceName,
                        username: passwordEntryState.username,
                        password: input,
                        notes: passwordEntryState.notes,
                    });

                    await CreatePassword(request);
                }

                // Copy password to clipboard
                await navigator.clipboard.writeText(input);

                // Clear UI state
                setInput("");
                setPasswordEntryState({
                    isActive: false,
                    serviceName: "",
                    username: "",
                    notes: "",
                    showPassword: false,
                    editingId: undefined,
                });

                // Instantly hide window after copying password
                try {
                    await HideSpotlight();
                } catch (error) {
                    console.error(
                        "Failed to hide window after password operation:",
                        error,
                    );
                }
            } catch (error) {
                const errorMsg = passwordEntryState.editingId
                    ? "Failed to update password"
                    : "Failed to add password";
                showPasswordEntryError(errorMsg);
                console.error("Password operation failed:", error);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (input.trim() === "") return;

        // Handle help mode - when user selects a help command
        if (isHelpMode() && navigation.selectedItem) {
            const selectedHelp = navigation.selectedItem;
            // If it's a command (starts with :), insert it into input
            if (selectedHelp.serviceName.startsWith(":")) {
                setInput(selectedHelp.serviceName);
                setShowDropdown(false);
                setResults([]);
                navigation.reset();
            }
            return;
        }

        // Handle command mode
        if (isCommandMode()) {
            const trimmedInput = input.trim();
            const lowerInput = trimmedInput.toLowerCase();

            // Frontend validation for :add command without arguments
            if (lowerInput === ":add") {
                showMessage("usage: :add service;username;notes");
                return;
            }

            // Special case: :add command - parse in frontend and switch to password entry mode
            if (lowerInput.startsWith(":add ") && !lowerInput.startsWith(":addgen")) {
                const args = trimmedInput.slice(5); // Remove ':add '
                const parts = args.split(";").map((p) => p.trim());

                if (parts.length < 2 || !parts[0] || !parts[1]) {
                    showMessage("usage: :add service;username;notes");
                    return;
                }

                // Switch to password entry mode
                setPasswordEntryState({
                    isActive: true,
                    serviceName: parts[0],
                    username: parts[1],
                    notes: parts[2] || "",
                    showPassword: false,
                });
                setInput("");
                setShowDropdown(false);
                setResults([]);
                navigation.reset();
                return;
            }

            // All other commands - send directly to backend
            try {
                setIsLoading(true);
                const result = await ExecuteCommand(trimmedInput);

                // Handle different command results
                if (lowerInput.startsWith(":addgen")) {
                    if (result) {
                        await navigator.clipboard.writeText(result);
                    }
                    setInput("");
                    await HideSpotlight();
                } else if (lowerInput.startsWith(":import")) {
                    showMessage(`Successfully imported ${result} passwords`);
                } else if (lowerInput.startsWith(":export")) {
                    showMessage("Export completed successfully");
                } else {
                    if (result && typeof result === "string") {
                        showMessage(result);
                    }
                    setInput("");
                }
            } catch (error) {
                showMessage(String(error));
                console.error("Command execution failed:", error);
            } finally {
                setIsLoading(false);
            }
        } else if (navigation.selectedItem) {
            // Copy password to clipboard - handled by navigation hook
            navigation.selectCurrent();
        }
    }, [input, navigation, passwordEntryState]);

    const handleDelete = useCallback(
        async (id: number) => {
            try {
                const entry = results.find((r) => r.id === id);
                await DeletePassword(id);
                showMessage(`Deleted ${entry?.serviceName || "entry"}`);

                // Refresh results
                if (input.trim() && isSearchMode()) {
                    const searchResults = await SearchPasswords(input.trim());
                    setResults(searchResults || []);
                    setShowDropdown(searchResults?.length > 0);
                }
                navigation.reset();
            } catch (error) {
                showMessage("Failed to delete entry");
                console.error("Delete failed:", error);
            }
        },
        [input, results, navigation],
    );

    const handleEdit = useCallback(
        async (id: number) => {
            try {
                const entry = results.find((r) => r.id === id);
                if (!entry) return;

                // Switch to password entry mode for editing
                setPasswordEntryState({
                    isActive: true,
                    serviceName: entry.serviceName,
                    username: entry.username,
                    notes: entry.notes,
                    showPassword: false,
                    editingId: id,
                });
                setInput("");
                setShowDropdown(false);
                setResults([]);
                navigation.reset();
            } catch (error) {
                showMessage("Failed to edit entry");
                console.error("Edit failed:", error);
            }
        },
        [results, navigation],
    );

    const handleLock = useCallback(async () => {
        try {
            await LockApp();
            onLogout();
        } catch (error) {
            console.error("Lock failed:", error);
        }
    }, [onLogout]);

    // Global keyboard event listener
    useEffect(() => {
        const handleGlobalKeyDown = async (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                // Clear UI state
                setInput("");
                setShowDropdown(false);
                setResults([]);
                setPasswordEntryState({
                    isActive: false,
                    serviceName: "",
                    username: "",
                    notes: "",
                    showPassword: false,
                    editingId: undefined,
                });
                navigation.reset();

                // Hide the window
                try {
                    await HideSpotlight();
                } catch (error) {
                    console.error("Failed to hide window:", error);
                }
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                if (showDropdown && navigation.selectedItem && !isHelpMode()) {
                    navigation.selectCurrent();
                } else if (document.activeElement === inputRef.current && !isHelpMode()) {
                    await handleSubmit();
                }
                return;
            }

            // Handle dropdown navigation with arrow keys
            if (showDropdown && results.length > 0) {
                // Down navigation: Arrow Down
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    // If currently no selection (-1), start with first item (0)
                    if (navigation.selectedIndex === -1) {
                        navigation.selectItem(0);
                    } else {
                        navigation.selectNext();
                    }
                }
                // Up navigation: Arrow Up
                else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    // If currently on first item (0), go back to input (-1)
                    if (navigation.selectedIndex === 0) {
                        navigation.reset(); // This sets selectedIndex to -1
                        // Focus back to input field
                        if (inputRef.current) {
                            inputRef.current.focus();
                        }
                    } else {
                        navigation.selectPrevious();
                    }
                }
                // Delete selected item
                else if (
                    e.key === "d" &&
                    e.ctrlKey &&
                    navigation.selectedItem &&
                    !isHelpMode()
                ) {
                    e.preventDefault();
                    await handleDelete(navigation.selectedItem.id);
                }
                // Edit selected item
                else if (
                    e.key === "e" &&
                    e.ctrlKey &&
                    navigation.selectedItem &&
                    !isHelpMode()
                ) {
                    e.preventDefault();
                    await handleEdit(navigation.selectedItem.id);
                }
            }

            // Global shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === "l") {
                e.preventDefault();
                await handleLock();
            }
        };

        document.addEventListener("keydown", handleGlobalKeyDown);
        return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }, [
        showDropdown,
        results,
        navigation,
        handleSubmit,
        handleDelete,
        handleEdit,
        handleLock,
    ]);

    const getInputClassName = () => {
        let className = "search-input";
        if (passwordEntryState.isActive) {
            className += " password-entry-mode";
        } else if (isCommandMode()) {
            className += " command-mode";
        }
        return className;
    };

    return (
        <div className="spotlight-window">
            <div className="search-container">
                <div className="input-container">
                    <input
                        ref={inputRef}
                        type={
                            passwordEntryState.isActive && !passwordEntryState.showPassword
                                ? "password"
                                : "text"
                        }
                        value={input}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className={`spotlight-input ${getInputClassName()}`}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        disabled={isLoading}
                    />
                    {passwordEntryState.isActive && (
                        <button
                            className="password-toggle-btn"
                            onClick={() =>
                                setPasswordEntryState((prev) => ({
                                    ...prev,
                                    showPassword: !prev.showPassword,
                                }))
                            }
                            type="button"
                            aria-label="Toggle password visibility"
                        >
                            {passwordEntryState.showPassword ? "●" : "○"}
                        </button>
                    )}
                </div>

                {showDropdown && results.length > 0 && (
                    <PasswordDropdown
                        results={results}
                        navigation={navigation}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}
