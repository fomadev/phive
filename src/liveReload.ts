import { WebSocketServer, WebSocket } from 'ws';
import * as vscode from 'vscode';
import * as path from 'path';

export class LiveReloadServer {
    private _wss: WebSocketServer | undefined;
    private _clients: Set<WebSocket> = new Set();
    private _reloadTimeout: NodeJS.Timeout | undefined;
    
    // Extensions de fichiers de base à surveiller pour le rechargement navigateur
    private readonly WATCHED_EXTENSIONS = ['php', 'html', 'css', 'js', 'json'];

    // Callback pour notifier le besoin de redémarrer le serveur PHP (v1.1.5)
    public onEnvFileSaved?: () => void;

    public start(port: number) {
        this._wss = new WebSocketServer({ port });

        this._wss.on('connection', (ws) => {
            this._clients.add(ws);
            ws.on('close', () => this._clients.delete(ws));
        });

        // Surveiller les changements de fichiers dans le projet
        vscode.workspace.onDidSaveTextDocument((document) => {
            const fileName = document.fileName;
            const basename = path.basename(fileName);
            
            // 1. Vérifier si le fichier fait partie des chemins à ignorer
            if (this.isIgnored(fileName)) {
                return;
            }

            // 2. NOUVEAUTÉ v1.1.5 : Détection des fichiers d'environnement (.env, .env.local, etc.)
            if (basename.startsWith('.env')) {
                if (this.onEnvFileSaved) {
                    this.onEnvFileSaved();
                }
                return;
            }

            // 3. Vérifier l'extension standard du fichier pour un simple reload navigateur
            const ext = path.extname(fileName).toLowerCase().replace('.', '');
            if (this.WATCHED_EXTENSIONS.includes(ext)) {
                this.scheduleReload();
            }
        });
    }

    private isIgnored(fileName: string): boolean {
        const config = vscode.workspace.getConfiguration('phive');
        const ignorePaths = config.get<string[]>('ignorePaths') || ['.git', 'node_modules', 'vendor', 'cache'];
        
        const normalizedPath = fileName.replace(/\\/g, '/');

        return ignorePaths.some(ignoredSegment => {
            if (!ignoredSegment) return false;
            return normalizedPath.includes(`/${ignoredSegment}/`) || normalizedPath.endsWith(`/${ignoredSegment}`);
        });
    }

    private scheduleReload() {
        const config = vscode.workspace.getConfiguration('phive');
        const delay = config.get<number>('reloadDelay') ?? 100;

        if (this._reloadTimeout) {
            clearTimeout(this._reloadTimeout);
        }

        this._reloadTimeout = setTimeout(() => {
            this.broadcastReload();
        }, delay);
    }

    public broadcastReload() {
        this._clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
    }

    public stop() {
        if (this._reloadTimeout) {
            clearTimeout(this._reloadTimeout);
        }
        this._wss?.close();
        this._clients.clear();
    }
}