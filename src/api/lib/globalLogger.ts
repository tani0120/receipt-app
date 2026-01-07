
// Simple in-memory log buffer for the "Debug Mode" viewer
// Stores the last N logs to display in the frontend.

const MAX_LOGS = 100;
const logBuffer: string[] = [];

export const getLogs = () => {
    return [...logBuffer]; // Return copy
};

export const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8); // HH:mm:ss
    const logLine = `[${timestamp}] ${message}`;

    logBuffer.push(logLine);
    if (logBuffer.length > MAX_LOGS) {
        logBuffer.shift(); // Remove oldest
    }
};

export const interceptConsole = () => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
        // 1. Standard output
        originalLog.apply(console, args);
        // 2. Buffer output (convert args to string)
        try {
            const msg = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            addLog(msg);
        } catch {
            // Ignore formatting errors
        }
    };

    console.error = (...args: any[]) => {
        originalError.apply(console, args);
        try {
            const msg = '[ERROR] ' + args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            addLog(msg);
        } catch { }
    };

    addLog('--- Log Capture Started ---');
};
