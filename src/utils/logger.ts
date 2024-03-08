import * as fs from 'fs';


export namespace logger {
    export const LOG_PATH = '/home/bedsteler20/flatpak-host/flatpak-host.log';
    
    export enum LogLevel {
        DEBUG = 'DEBUG',
        INFO = 'INFO',
        WARN = 'WARN',
        ERROR = 'ERROR',
        VERBOSE = 'VERBOSE'
    }

    export function write(level: LogLevel, ...messages: string[]) {
        const message = messages.join(' ');
        fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} [${level}] ${message}\n`);
    }

    export function debug(...message: any[]) {
        write(LogLevel.DEBUG, ...message);
    }

    export function info(...message: any[]) {
        write(LogLevel.INFO, ...message);
    }

    export function error(...message: any[]) {
        write(LogLevel.ERROR, ...message);
    }

    export function warn(...message:any[]) {
        write(LogLevel.WARN, ...message);
    }

    export function log(...message:any[]) {
        write(LogLevel.VERBOSE, ...message);
    }
}