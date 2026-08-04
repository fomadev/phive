import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class PHPStackManager {
    private _process: cp.ChildProcess | undefined;
    private _outputChannel: vscode.OutputChannel;
    private _routerPath: string | undefined;
    private _requestCount = 0;

    // Métadonnées de session conservées pour permettre le redémarrage à chaud (v1.1.5)
    private _lastServerParams: {
        rootPath: string;
        host: string;
        port: number;
        wsPort: number;
        ip: string;
    } | undefined;

    constructor() {
        // v1.1.6 : Utilisation de la grammaire "log" pour activer la coloration syntaxique native (Light/Dark mode)
        this._outputChannel = vscode.window.createOutputChannel("Phive Server Logs", "log");
    }

    /**
     * Démarre le serveur PHP avec un routeur personnalisé et le binaire configuré
     */
    public async start(rootPath: string, host: string, port: number, wsPort: number, ip: string) {
        // Enregistrer les paramètres de lancement actuels pour un éventuel restart (.env)
        this._lastServerParams = { rootPath, host, port, wsPort, ip };

        this.stopProcessOnly(); 
        this._requestCount = 0;

        // 1. Récupérer le chemin PHP depuis la configuration
        const config = vscode.workspace.getConfiguration('phive');
        const phpBinary = config.get<string>('phpPath') || 'php';

        this._outputChannel.clear();
        this._outputChannel.show();
        this._outputChannel.appendLine(`[INFO] [Phive] Attempting to start using: ${phpBinary}`);

        // 2. Script JS à injecter (Live Reload)
        const injectionScript = `
        <script>
            (function() {
                const socket = new WebSocket('ws://${ip}:${wsPort}');
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
        this._routerPath = path.join(rootPath, routerFileName);
        const routerContent = `<?php
        $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
        $file = __DIR__ . $path;

        if (is_dir($file)) {
            $file = rtrim($file, "/") . "/index.php";
        }

        if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === "php") {
            ob_start();
            include $file;
            $content = ob_get_clean();
            if (strpos($content, '</body>') !== false) {
                echo str_replace("</body>", "${injectionScript}</body>", $content);
            } else {
                echo $content . "${injectionScript}";
            }
        } else {
            return false;
        }
        `;

        try {
            fs.writeFileSync(this._routerPath, routerContent);
            // Masquer le fichier dans l'explorateur VS Code
            this._toggleFileVisibility(routerFileName, true);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to create router file: ${err}`);
            return;
        }

        // 4. Lancer le serveur avec le binaire personnalisé
        this._process = cp.spawn(phpBinary, ['-S', `${host}:${port}`, this._routerPath], {
            cwd: rootPath
        });

        this._outputChannel.appendLine(`[INFO] [Phive] Server started: http://${ip}:${port}`);

        // 5. Gestion des logs et erreurs (v1.1.6 : Formatage coloré selon le statut HTTP)
        this._process.stderr?.on('data', (data) => {
            const rawLog = data.toString().trim();
            if (!rawLog) return;

            const time = new Date().toLocaleTimeString();

            if (rawLog.includes('Accepted')) {
                this._requestCount++;
                this._outputChannel.appendLine(`[INFO] [Req #${this._requestCount}] ${time} - ${rawLog}`);
            } else if (rawLog.includes('Closing') || rawLog.includes('Closing')) {
                this._outputChannel.appendLine(`[DEBUG] ${time} - ${rawLog}`);
            } else {
                // Analyse du code statut HTTP retourné par le serveur de dev PHP
                const formattedLog = this.formatHttpLog(rawLog, time);
                this._outputChannel.appendLine(formattedLog);
            }
        });

        this._process.stdout?.on('data', (data) => {
            this._outputChannel.appendLine(`[INFO] ${data.toString().trim()}`);
        });

        this._process.on('close', (code) => {
            this._outputChannel.appendLine(`[WARN] [Phive] Server stopped (Code: ${code})`);
            this._cleanup();
        });

        this._process.on('error', (err: any) => {
            const errorMsg = err.code === 'ENOENT' 
                ? `PHP executable not found at "${phpBinary}". Check your Phive settings.`
                : `PHP Error: ${err.message}`;
            
            this._outputChannel.appendLine(`[ERROR] ${errorMsg}`);
            vscode.window.showErrorMessage(errorMsg);
            this._cleanup();
        });
    }

    /**
     * Formatage visuel des requêtes HTTP (v1.1.6)
     * Ajoute des préfixes standardisés pris en charge par le moteur de coloration de VS Code.
     */
    private formatHttpLog(rawLog: string, time: string): string {
        // Extraction du code HTTP (ex: 200, 404, 500)
        const statusCodeMatch = rawLog.match(/\b([1-5]\d\d)\b/);
        
        if (statusCodeMatch) {
            const statusCode = parseInt(statusCodeMatch[1], 10);

            if (statusCode >= 200 && statusCode < 300) {
                return `[INFO] [${statusCode} OK] ${time} - ${rawLog}`; // Vert en thème VS Code Log
            } else if (statusCode >= 300 && statusCode < 400) {
                return `[WARN] [${statusCode} REDIRECT] ${time} - ${rawLog}`; // Jaune
            } else if (statusCode >= 400 && statusCode < 500) {
                return `[WARN] [${statusCode} NOT FOUND] ${time} - ${rawLog}`; // Jaune / Orange
            } else if (statusCode >= 500) {
                return `[ERROR] [${statusCode} SERVER ERROR] ${time} - ${rawLog}`; // Rouge
            }
        }

        return `[LOG] ${time} - ${rawLog}`;
    }

    /**
     * Redémarre à chaud le serveur PHP (Utile pour recharger les fichiers d'environnement .env)
     */
    public async restartServer() {
        if (!this._lastServerParams) {
            return;
        }

        const { rootPath, host, port, wsPort, ip } = this._lastServerParams;
        
        // Arrêt du processus sans afficher le message de fermeture définitive
        this.stopProcessOnly();

        // Relance avec les mêmes paramètres de session
        await this.start(rootPath, host, port, wsPort, ip);
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
    public stop() {
        if (this._process) {
            this._process.kill();
            this._process = undefined;
            vscode.window.showInformationMessage("Phive server stopped.");
        }
        this._lastServerParams = undefined;
        this._cleanup();
    }

    /**
     * Supprime le fichier router et le réaffiche dans VS Code
     */
    private _cleanup() {
        if (this._routerPath) {
            const routerFileName = path.basename(this._routerPath);
            
            // 1. Réafficher le fichier avant de le supprimer pour éviter les résidus de config
            this._toggleFileVisibility(routerFileName, false);

            // 2. Suppression physique
            if (fs.existsSync(this._routerPath)) {
                try {
                    fs.unlinkSync(this._routerPath);
                } catch (e) {
                    console.error("Failed to delete router file", e);
                }
            }
        }
    }

    /**
     * Ajoute ou retire le fichier de la liste d'exclusion de VS Code
     */
    private async _toggleFileVisibility(fileName: string, hide: boolean) {
        const config = vscode.workspace.getConfiguration('files');
        // On récupère une copie profonde pour ne pas muter l'original directement
        const exclude = { ...config.get<any>('exclude') };
        
        const isCurrentlyHidden = !!exclude[fileName];
        if (hide === isCurrentlyHidden) return; // Pas de changement nécessaire

        if (hide) {
            exclude[fileName] = true;
        } else {
            delete exclude[fileName];
        }

        await config.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
    }
}