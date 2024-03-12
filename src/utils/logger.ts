import { ChildProcess } from 'child_process';
import * as fs from 'fs';


export namespace logger {
    export const LOG_DIR = '/home/bedsteler20/Projects/flatpak-vscode';
    export const LOG_FILE = 'flatpak-host.log';
    export const LOG_PATH = `${LOG_DIR}/${LOG_FILE}`;

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


    export function logProcess(process: ChildProcess, file: string) {
        process.stdout?.on('data', (data) => {
            write(LogLevel.VERBOSE, `${file} stdout: ${data}`);
        });

        process.stderr?.on('data', (data) => {
            write(LogLevel.ERROR, `${file} stderr: ${data}`);
        });

        process.on('close', (code) => {
            write(LogLevel.INFO, `${file} exited with code ${code}`);
        });
    }
}