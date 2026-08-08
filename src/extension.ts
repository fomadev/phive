import * as vscode from 'vscode';
import * as portfinder from 'portfinder';
import open = require('open');
import { PHPStackManager } from './serverManager';
import { LiveReloadServer } from './liveReload';
import { getLocalIPv4 } from './networkUtils';

let statusBarItem: vscode.StatusBarItem;
let phpManager = new PHPStackManager();
let lrServer = new LiveReloadServer();
let isRunning = false;
let currentIp: string = "";
let currentPort: number = 0;
let currentProtocol: string = "http";

export function activate(context: vscode.ExtensionContext) {
    
    let startCommand = vscode.commands.registerCommand('phive.startServer', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Please open a project folder.");
            return;
        }

        // 1. Sélection du dossier (Gestion Multi-root)
        let rootPath: string;
        if (workspaceFolders.length === 1) {
            rootPath = workspaceFolders[0].uri.fsPath;
        } else {
            const selected = await vscode.window.showQuickPick(
                workspaceFolders.map(f => ({ label: f.name, description: f.uri.fsPath })),
                { placeHolder: "Select the project folder to launch with Phive" }
            );
            if (!selected) return; // Annulation de l'utilisateur
            rootPath = selected.description;
        }

        currentIp = getLocalIPv4();

        // 2. Récupération des configurations (Port et HTTPS)
        const config = vscode.workspace.getConfiguration('phive');
        const preferredPort = config.get<number>('port') || 8000;
        const enableHTTPS = config.get<boolean>('enableHTTPS') || false;
        
        currentProtocol = enableHTTPS ? 'https' : 'http';

        try {
            // 3. Utilisation du port configuré comme point de départ pour portfinder
            currentPort = await portfinder.getPortPromise({ port: preferredPort });
            const wsPort = await portfinder.getPortPromise({ port: 9001 });

            // Alerte l'utilisateur si le port préféré ou le port WS est occupé
            if (currentPort !== preferredPort) {
                vscode.window.showWarningMessage(`Port ${preferredPort} is occupied. Phive automatically switched to port ${currentPort}.`);
            }
            
            if (wsPort !== 9001) {
                vscode.window.showWarningMessage(`Port 9001 is occupied. WebSocket port automatically switched to ${wsPort}.`);
            }

            // Démarrage des serveurs avec les ports validés
            lrServer.start(wsPort);
            lrServer.onEnvFileSaved = async () => {
                if (!isRunning) {
                    return;
                }

                await phpManager.restartServer();
                lrServer.broadcastReload();
            };

            // Transmettre "context" à phpManager.start()
            await phpManager.start(context, rootPath, "0.0.0.0", currentPort, wsPort, currentIp);
            
            isRunning = true;
            updateStatusBar(currentIp, currentPort, currentProtocol);

            // Ouverture du navigateur local avec le bon protocole
            const url = `${currentProtocol}://localhost:${currentPort}`;
            open(url);

            // Message informatif principal
            const networkUrl = `${currentProtocol}://${currentIp}:${currentPort}`;
            vscode.window.showInformationMessage(`✅ Phive Live: Server active on ${networkUrl}`);
            
            // Notification pour la connexion réseau/mobile
            if (currentPort !== preferredPort) {
                vscode.window.showInformationMessage(`📱 Connect your mobile device to ${networkUrl} (custom port due to conflict)`);
            } else {
                vscode.window.showInformationMessage(`📱 Connect your mobile device to ${networkUrl}`);
            }
            
        } catch (err) {
            vscode.window.showErrorMessage("❌ Phive port allocation error: " + err);
        }
    });

    let stopCommand = vscode.commands.registerCommand('phive.stopServer', async () => {
        await phpManager.stop();
        lrServer.stop();
        isRunning = false;
        updateStatusBar();
        vscode.window.showInformationMessage("🛑 Phive server stopped");
    });

    // Initialisation de la barre de statut
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updateStatusBar();
    statusBarItem.show();

    context.subscriptions.push(startCommand, stopCommand, statusBarItem);
}

/**
 * Met à jour l'interface visuelle de la barre de statut
 */
function updateStatusBar(ip?: string, port?: number, protocol: string = 'http') {
    if (!isRunning) {
        statusBarItem.text = `$(play) Phive: Go Live`;
        statusBarItem.command = 'phive.startServer';
        statusBarItem.tooltip = "🚀 Start the PHP Live Reload server";
        statusBarItem.backgroundColor = undefined;
    } else {
        // Affichage de l'IP, du Port et prise en compte du protocole dans le tooltip
        statusBarItem.text = `$(primitive-square) Phive: ${ip}:${port}`;
        statusBarItem.command = 'phive.stopServer';
        statusBarItem.tooltip = `✅ Server active on ${protocol}://${ip}:${port} (Click to stop)`;
        
        // Couleur d'arrière-plan distinctive pour indiquer le statut actif
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
}

export async function deactivate() {
    await phpManager.stop();
    lrServer.stop();
}