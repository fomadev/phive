import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

export interface SSLConfig {
    certPath: string;
    keyPath: string;
}

/**
 * Charge les certificats SSL personnalisés ou génère un certificat auto-signé
 */
export async function getOrGenerateSSLConfig(context: vscode.ExtensionContext): Promise<SSLConfig | null> {
    const config = vscode.workspace.getConfiguration('phive');
    const customCert = config.get<string>('sslCertPath')?.trim();
    const customKey = config.get<string>('sslKeyPath')?.trim();

    // 1. Si l'utilisateur a spécifié ses propres certificats
    if (customCert && customKey) {
        if (fs.existsSync(customCert) && fs.existsSync(customKey)) {
            return {
                certPath: customCert,
                keyPath: customKey
            };
        } else {
            vscode.window.showErrorMessage(`[Phive SSL] Fichiers SSL introuvables aux chemins spécifiés : ${customCert} ou ${customKey}`);
            return null;
        }
    }

    // 2. Génération / Récupération du certificat auto-signé local
    const storageDir = context.globalStorageUri.fsPath;
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }

    const autoCertPath = path.join(storageDir, 'phive-selfsigned.crt');
    const autoKeyPath = path.join(storageDir, 'phive-selfsigned.key');

    // S'ils existent déjà, on les réutilise
    if (fs.existsSync(autoCertPath) && fs.existsSync(autoKeyPath)) {
        return {
            certPath: autoCertPath,
            keyPath: autoKeyPath
        };
    }

    // Sinon, on génère un nouveau couple de clés
    const generated = await generateSelfSignedCertificate(autoCertPath, autoKeyPath);
    if (generated) {
        return {
            certPath: autoCertPath,
            keyPath: autoKeyPath
        };
    }

    return null;
}

/**
 * Génère un certificat auto-signé à l'aide de 'selfsigned' ou d'OpenSSL CLI.
 * Note: selfsigned v5+ expose une API async — generate() retourne une Promise.
 */
async function generateSelfSignedCertificate(certPath: string, keyPath: string): Promise<boolean> {
    // 1. Tentative via le package npm 'selfsigned' (async depuis la v5)
    try {
        const selfsigned = require('selfsigned');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        // selfsigned.generate() est async depuis v5 — on doit l'attendre
        const pkey = await selfsigned.generate(attrs, { days: 365, keySize: 2048 });

        if (!pkey?.cert || !pkey?.private) {
            throw new Error('selfsigned returned empty cert or private key');
        }

        fs.writeFileSync(certPath, pkey.cert, { encoding: 'utf8' });
        fs.writeFileSync(keyPath, pkey.private, { encoding: 'utf8' });
        return true;
    } catch {
        // 2. Fallback : tentative via l'utilitaire OpenSSL CLI du système
        const cmd = `openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyPath}" -out "${certPath}" -days 365 -subj "/CN=localhost"`;

        return new Promise((resolve) => {
            cp.exec(cmd, (error) => {
                if (error) {
                    vscode.window.showErrorMessage(
                        "[Phive SSL] Impossible de générer le certificat auto-signé. Installez 'selfsigned' ou OpenSSL sur votre système."
                    );
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }
}