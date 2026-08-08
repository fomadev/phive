import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vscode from 'vscode';

export interface SSLConfig {
    certPath: string;
    keyPath: string;
}

/**
 * Récupère les certificats configurés ou en génère de nouveaux automatiquement
 * dans le stockage global de l'extension.
 */
export async function getOrGenerateSSLConfig(context: vscode.ExtensionContext): Promise<SSLConfig | null> {
    const config = vscode.workspace.getConfiguration('phive');
    const customCert = config.get<string>('sslCertPath')?.trim();
    const customKey = config.get<string>('sslKeyPath')?.trim();

    // 1. Validation des certificats personnalisés si renseignés
    if (customCert && customKey) {
        if (fs.existsSync(customCert) && fs.existsSync(customKey)) {
            return { certPath: customCert, keyPath: customKey };
        } else {
            vscode.window.showErrorMessage(
                "[Phive] SSL custom files not found. Check 'phive.sslCertPath' and 'phive.sslKeyPath'."
            );
            return null;
        }
    }

    // 2. Dossier de stockage global de Phive dans VS Code
    const storageDir = context.globalStorageUri.fsPath;
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }

    const autoCertPath = path.join(storageDir, 'phive_selfsigned.crt');
    const autoKeyPath = path.join(storageDir, 'phive_selfsigned.key');

    // Réutilisation du certificat s'il existe déjà
    if (fs.existsSync(autoCertPath) && fs.existsSync(autoKeyPath)) {
        return { certPath: autoCertPath, keyPath: autoKeyPath };
    }

    // 3. Génération automatique avec OpenSSL
    const generated = await generateSelfSignedCertWithOpenSSL(autoCertPath, autoKeyPath);
    if (generated) {
        return { certPath: autoCertPath, keyPath: autoKeyPath };
    }

    vscode.window.showErrorMessage(
        "[Phive] Failed to auto-generate SSL certificate. Ensure 'openssl' is available in your system PATH or provide custom certs."
    );
    return null;
}

/**
 * Exécute la commande CLI OpenSSL pour créer un certificat auto-signé
 */
function generateSelfSignedCertWithOpenSSL(certPath: string, keyPath: string): Promise<boolean> {
    return new Promise((resolve) => {
        const command = `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost/O=Phive Server"`;

        cp.exec(command, (error) => {
            if (error) {
                console.error('[Phive] OpenSSL execution failed:', error);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}