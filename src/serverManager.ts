import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { buildRouterContent, getRouterFilePath } from './serverHelpers/routerBuilder';
import { ServerLogger } from './serverHelpers/serverLogger';
import { toggleFileVisibility } from './serverHelpers/fileVisibility';
import { getOrGenerateSSLConfig } from './serverHelpers/sslManager';

export class PHPStackManager {
    private _process: cp.ChildProcess | undefined;
    private _outputChannel: vscode.OutputChannel;
    private _logger: ServerLogger;
    private _routerPath: string | undefined;

    // Métadonnées de session conservées pour permettre le redémarrage à chaud (v1.1.5)
    private _lastServerParams: {
        context: vscode.ExtensionContext;
        rootPath: string;
        host: string;
        port: number;
        wsPort: number;
        ip: string;
    } | undefined;

    constructor() {
        // v1.1.6 : Utilisation de la grammaire "log" pour activer la coloration syntaxique native (Light/Dark mode)
        this._outputChannel = vscode.window.createOutputChannel("Phive Server Logs", "log");
        this._logger = new ServerLogger(this._outputChannel);
    }

    /**
     * Démarre le serveur PHP avec un routeur personnalisé, le binaire configuré et le support HTTPS optionnel
     */
    public async start(
        context: vscode.ExtensionContext,
        rootPath: string,
        host: string,
        port: number,
        wsPort: number,
        ip: string
    ) {
        // Enregistrer les paramètres de lancement actuels pour un éventuel restart (.env)
        this._lastServerParams = { context, rootPath, host, port, wsPort, ip };

        this.stopProcessOnly(); 
        this._logger.reset();

        // 1. Récupérer la configuration PHP et HTTPS
        const config = vscode.workspace.getConfiguration('phive');
        const phpBinary = config.get<string>('phpPath') || 'php';
        const enableHTTPS = config.get<boolean>('enableHTTPS') || false;

        this._outputChannel.clear();
        this._outputChannel.show();
        this._logger.logInfo(`[INFO] [Phive] Attempting to start using: ${phpBinary}`);

        let wsProtocol = 'ws';
        let httpProtocol = 'http';

        if (enableHTTPS) {
            const sslConfig = await getOrGenerateSSLConfig(context);
            if (!sslConfig) {
                this._logger.logInfo(`[ERROR] [Phive] HTTPS activation aborted due to missing SSL certificates.`);
                return;
            }
            wsProtocol = 'wss';
            httpProtocol = 'https';
            this._logger.logInfo(`[INFO] [Phive] Experimental HTTPS enabled using cert: ${sslConfig.certPath}`);
        }

        // 2. Script JS à injecter (Live Reload compatible WSS)
        const injectionScript = `
        <script>
            (function() {
                const socket = new WebSocket('${wsProtocol}://${ip}:${wsPort}');
                socket.onmessage = (msg) => { 
                    if (msg.data === 'reload') {
                        console.log('Phive: Reloading...');
                        window.location.reload(); 
                    }
                };
                socket.onopen = () => console.log('Phive: Live Reload Connected');
                socket.onerror = () => console.error('Phive: Live Reload Connection Error');
            })();
        </script>`.replace(/\n/g, ''); 

        // 3. Création du fichier Router PHP temporaire
        const routerFileName = '.phive_router.php';
        this._routerPath = getRouterFilePath(rootPath);
        const routerContent = buildRouterContent(injectionScript);

        try {
            fs.writeFileSync(this._routerPath, routerContent);
            // Masquer le fichier dans l'explorateur VS Code
            await toggleFileVisibility(routerFileName, true);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to create router file: ${err}`);
            return;
        }

        // 4. Lancer le serveur avec le binaire personnalisé
        this._process = cp.spawn(phpBinary, ['-S', `${host}:${port}`, this._routerPath], {
            cwd: rootPath
        });

        this._logger.logInfo(`[INFO] [Phive] Server started: ${httpProtocol}://${ip}:${port}`);

        // 5. Gestion des logs et erreurs
        this._process.stderr?.on('data', (data) => {
            const rawLog = data.toString().trim();
            const time = new Date().toLocaleTimeString();
            this._logger.logRequest(rawLog, time);
        });

        this._process.stdout?.on('data', (data) => {
            this._logger.logInfo(`[INFO] ${data.toString().trim()}`);
        });

        this._process.on('close', async (code) => {
            this._logger.logInfo(`[WARN] [Phive] Server stopped (Code: ${code})`);
            await this._cleanup();
        });

        this._process.on('error', async (err: any) => {
            const errorMsg = err.code === 'ENOENT' 
                ? `PHP executable not found at "${phpBinary}". Check your Phive settings.`
                : `PHP Error: ${err.message}`;
            
            this._logger.logInfo(`[ERROR] ${errorMsg}`);
            vscode.window.showErrorMessage(errorMsg);
            await this._cleanup();
        });
    }

    /**
     * Redémarre à chaud le serveur PHP
     */
    public async restartServer() {
        if (!this._lastServerParams) {
            return;
        }

        const { context, rootPath, host, port, wsPort, ip } = this._lastServerParams;
        
        this.stopProcessOnly();
        await this.start(context, rootPath, host, port, wsPort, ip);
    }

    /**
     * Arrête uniquement le processus enfant PHP en arrière-plan sans déclencher de notification
     */
    private stopProcessOnly() {
        if (this._process) {
            this._process.kill();
            this._process = undefined;
        }
    }

    /**
     * Arrête le processus PHP, notifie l'utilisateur et nettoie les fichiers temporaires
     */
    public async stop() {
        if (this._process) {
            this._process.kill();
            this._process = undefined;
            vscode.window.showInformationMessage("Phive server stopped.");
        }
        this._lastServerParams = undefined;
        await this._cleanup();
    }

    /**
     * Supprime le fichier router et le réaffiche dans VS Code
     */
    private async _cleanup() {
        if (this._routerPath) {
            const routerFileName = path.basename(this._routerPath);
            
            await toggleFileVisibility(routerFileName, false);

            if (fs.existsSync(this._routerPath)) {
                try {
                    fs.unlinkSync(this._routerPath);
                } catch (e) {
                    console.error("Failed to delete router file", e);
                }
            }
        }
    }
}