import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
// npm install selfsigned (ou génération via OpenSSL child_process)

export async function ensureSSLCertificates(storagePath: string): Promise<{ cert: string; key: string } | null> {
    const certPath = path.join(storagePath, 'phive_cert.pem');
    const keyPath = path.join(storagePath, 'phive_key.pem');

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return { cert: certPath, key: keyPath };
    }

    // Génération automatique du certificat auto-signé
    // ...
    return { cert: certPath, key: keyPath };
}