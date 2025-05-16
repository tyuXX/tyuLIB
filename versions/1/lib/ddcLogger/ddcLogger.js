class DDCLogger {
    constructor(level = LogLevel.DEFAULT) {
        this.logLevel = level;
        this.logs = [];
    }
    
    setLogLevel(level) {
        this.logLevel = level;
    }

    log(message, args = {timestamp: "true", source: "None"}, level = LogLevel.INFO) {
        let msg = "";
        if (args.includes("timestamp")) {
            msg += `[${new Date().toISOString()} / ${args.source}] `;
        }
        msg += message;
        this.logs.push({ message: msg, level });
    }
}

class LogLevel {
    static INFO = 'info';
    static DEBUG = 'debug';
    static WARN = 'warn';
    static ERROR = 'error';
    static FATAL = 'fatal';
    static SYSTEM = 'system';
    static NONE = 'none';
    static DEFAULT = LogLevel.INFO;

    static getLogLevelByName(name) {
        return Object.values(LogLevel).find(level => level.toLowerCase() === name.toLowerCase()) || LogLevel.DEFAULT;
    }

    static getLogLevelByIndex(index) {
        return Object.values(LogLevel)[index] || LogLevel.DEFAULT;
    }
}


var globalLogger = new DDCLogger();