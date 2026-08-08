import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import { SSLConfig } from './sslManager';

export class HTTPSProxyServer {
    private _server: https.Server | undefined;

    /**
     * Démarre le serveur Reverse Proxy HTTPS qui transfère le trafic SSL vers le serveur PHP HTTP
     * @param sslConfig Chemins des certificats SSL
     * @param publicPort Port externe exposé aux clients (ex: 8000)
     * @param targetPort Port interne où écoute le serveur PHP CLI (ex: 8010)
     */
    public start(sslConfig: SSLConfig, publicPort: number, targetPort: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Lecture des fichiers de certificats SSL
                const options: https.ServerOptions = {
                    key: fs.readFileSync(sslConfig.keyPath),
                    cert: fs.readFileSync(sslConfig.certPath)
                };

                this._server = https.createServer(options, (req: http.IncomingMessage, res: http.ServerResponse) => {
                    // Préparation de la requête transmise au serveur PHP en HTTP local
                    const proxyOptions: http.RequestOptions = {
                        hostname: '127.0.0.1',
                        port: targetPort,
                        path: req.url,
                        method: req.method,
                        headers: {
                            ...req.headers,
                            'x-forwarded-proto': 'https',
                            'x-forwarded-host': req.headers.host || '',
                            'x-forwarded-for': req.socket.remoteAddress || ''
                        }
                    };

                    const proxyReq = http.request(proxyOptions, (proxyRes: http.IncomingMessage) => {
                        // Transmettre les en-têtes et le code HTTP de réponse
                        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                        proxyRes.pipe(res, { end: true });
                    });

                    // Gestion des erreurs lors du transfert de la requête
                    proxyReq.on('error', (err) => {
                        console.error('[Phive Proxy Error]', err);
                        if (!res.headersSent) {
                            res.writeHead(502, { 'Content-Type': 'text/plain' });
                            res.end('Phive HTTPS Proxy Error: Unable to connect to background PHP process.');
                        }
                    });

                    // Injection du corps de la requête cliente (POST/PUT/PATCH)
                    req.pipe(proxyReq, { end: true });
                });

                this._server.on('error', (err) => {
                    reject(err);
                });

                // Écoute sur toutes les interfaces réseau (0.0.0.0) pour préserver le partage WiFi
                this._server.listen(publicPort, '0.0.0.0', () => {
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Arrête le serveur proxy et ferme les connexions SSL actives
     */
    public stop(): void {
        if (this._server) {
            this._server.close();
            this._server = undefined;
        }
    }
}