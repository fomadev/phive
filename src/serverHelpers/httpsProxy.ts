import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import { SSLConfig } from './sslManager';

export class HTTPSProxyServer {
    private _proxyServer: https.Server | undefined;

    /**
     * Démarre un Reverse Proxy HTTPS qui transfère le trafic vers le serveur PHP HTTP interne.
     */
    public start(sslConfig: SSLConfig, externalPort: number, internalPhpPort: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const options: https.ServerOptions = {
                    cert: fs.readFileSync(sslConfig.certPath),
                    key: fs.readFileSync(sslConfig.keyPath)
                };

                this._proxyServer = https.createServer(options, (req, res) => {
                    // Transférer la requête vers le serveur PHP interne (HTTP)
                    const proxyReq = http.request(
                        {
                            hostname: '127.0.0.1',
                            port: internalPhpPort,
                            path: req.url,
                            method: req.method,
                            headers: {
                                ...req.headers,
                                'x-forwarded-proto': 'https',
                                'host': req.headers.host || `localhost:${externalPort}`
                            }
                        },
                        (phpRes) => {
                            res.writeHead(phpRes.statusCode || 200, phpRes.headers);
                            phpRes.pipe(res, { end: true });
                        }
                    );

                    proxyReq.on('error', (err) => {
                        console.error('[Phive Proxy Error]', err);
                        if (!res.headersSent) {
                            res.writeHead(502, { 'Content-Type': 'text/plain' });
                            res.end('Phive HTTPS Proxy Error: PHP internal server unreachable.');
                        }
                    });

                    req.pipe(proxyReq, { end: true });
                });

                this._proxyServer.listen(externalPort, '0.0.0.0', () => {
                    resolve();
                });

                this._proxyServer.on('error', (err) => {
                    reject(err);
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Arrête le serveur Proxy HTTPS
     */
    public stop() {
        if (this._proxyServer) {
            this._proxyServer.close();
            this._proxyServer = undefined;
        }
    }
}