import * as vscode from 'vscode';

export class ServerLogger {
    private readonly outputChannel: vscode.OutputChannel;
    private requestCount = 0;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public reset(): void {
        this.requestCount = 0;
    }

    public logInfo(message: string): void {
        this.outputChannel.appendLine(message);
    }

    public logRequest(rawLog: string, time: string): void {
        if (!rawLog) return;

        if (rawLog.includes('Accepted')) {
            this.requestCount++;
            this.logInfo(`[INFO] [Req #${this.requestCount}] ${time} - ${rawLog}`);
            return;
        }

        if (rawLog.includes('Closing')) {
            this.logInfo(`[DEBUG] ${time} - ${rawLog}`);
            return;
        }

        this.logInfo(this.formatHttpLog(rawLog, time));
    }

    private formatHttpLog(rawLog: string, time: string): string {
        const statusCodeMatch = rawLog.match(/\b([1-5]\d\d)\b/);

        if (statusCodeMatch) {
            const statusCode = parseInt(statusCodeMatch[1], 10);

            if (statusCode >= 200 && statusCode < 300) {
                return `[INFO] [${statusCode} OK] ${time} - ${rawLog}`;
            }
            if (statusCode >= 300 && statusCode < 400) {
                return `[WARN] [${statusCode} REDIRECT] ${time} - ${rawLog}`;
            }
            if (statusCode >= 400 && statusCode < 500) {
                return `[WARN] [${statusCode} NOT FOUND] ${time} - ${rawLog}`;
            }
            if (statusCode >= 500) {
                return `[ERROR] [${statusCode} SERVER ERROR] ${time} - ${rawLog}`;
            }
        }

        return `[LOG] ${time} - ${rawLog}`;
    }
}
