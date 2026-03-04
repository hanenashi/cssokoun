// Build the heavy logger function
const heavyLogger = function(level, moduleName, ...args) {
    if (!window.cssokoun.state.debug && level !== 'ERROR') return;

    const prefix = `[cssokoun::${moduleName}]`;
    const styles = {
        INFO:  'color: #0f0; background: #111; padding: 2px 6px; border-radius: 3px;',
        WARN:  'color: #fa0; background: #111; padding: 2px 6px; border-radius: 3px;',
        ERROR: 'color: #f00; background: #111; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
        SNIFF: 'color: #0ff; background: #111; padding: 2px 6px; border-radius: 3px; font-style: italic;'
    };

    const style = styles[level] || styles.INFO;
    const logMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    logMethod(`%c${prefix}`, style, ...args);
};

// 1. Flush the buffer from the Core's boot process
if (window.cssokoun._logBuffer && window.cssokoun._logBuffer.length > 0) {
    window.cssokoun._logBuffer.forEach(entry => {
        heavyLogger(entry.level, entry.moduleName, ...entry.args);
    });
    // Empty the buffer and delete it to free memory
    window.cssokoun._logBuffer = [];
    delete window.cssokoun._logBuffer;
}

// 2. Hijack the global log function
window.cssokoun.log = heavyLogger;

// 3. Announce that the heavy logger is online
window.cssokoun.log('INFO', 'sys-logger', 'Heavy Logger Module loaded and took control.');
