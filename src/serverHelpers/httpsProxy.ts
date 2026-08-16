import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as net from 'net';
import { SSLConfig } from './sslManager';

export class HTTPSProxyServer {
    private _server: https.Server | undefined;

    /**
     * Démarre le serveur Reverse Proxy HTTPS / WSS
     * @param sslConfig Chemins des certificats SSL
     * @param publicPort Port externe exposé aux clients (ex: 8000)
     * @param targetPhpPort Port interne du serveur PHP CLI (ex: 8010)
     * @param targetWsPort Port interne du serveur WebSocket Live Reload (ex: 8001)
     */
    public start(
        sslConfig: SSLConfig, 
        publicPort: number, 
        targetPhpPort: number,
        targetWsPort?: number
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const options: https.ServerOptions = {
                    key: fs.readFileSync(sslConfig.keyPath),
                    cert: fs.readFileSync(sslConfig.certPath)
                };

                // 1. Gestion du trafic HTTP -> HTTPS
                this._server = https.createServer(options, (req: http.IncomingMessage, res: http.ServerResponse) => {
                    const proxyOptions: http.RequestOptions = {
                        hostname: '127.0.0.1',
                        port: targetPhpPort,
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
                        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                        proxyRes.pipe(res, { end: true });
                    });

                    proxyReq.on('error', (err) => {
                        console.error('[Phive Proxy Error]', err);
                        if (!res.headersSent) {
                            res.writeHead(502, { 'Content-Type': 'text/plain' });
                            res.end('Phive HTTPS Proxy Error: Unable to connect to background PHP process.');
                        }
                    });

                    req.pipe(proxyReq, { end: true });
                });

                // 2. Support WSS (WebSocket Upgrade Relay) pour le Live Reload
                if (targetWsPort) {
                    this._server.on('upgrade', (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
                        // Redirection du flux TCP brut vers le port WebSocket local
                        const proxySocket = net.connect(targetWsPort, '127.0.0.1', () => {
                            proxySocket.write(
                                `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
                                Object.keys(req.headers)
                                    .map(key => `${key}: ${req.headers[key]}`)
                                    .join('\r\n') +
                                '\r\n\r\n'
                            );
                            proxySocket.write(head);
                            proxySocket.pipe(socket);
                            socket.pipe(proxySocket);
                        });

                        proxySocket.on('error', (err) => {
                            console.error('[Phive WSS Proxy Error]', err);
                            socket.destroy();
                        });

                        socket.on('error', () => proxySocket.destroy());
                    });
                }

                this._server.on('error', (err) => reject(err));

                // Intercepter les erreurs de handshake TLS pour éviter les fuites silencieuses.
                // Sans ce handler, les échecs TLS sont ignorés et la socket reste indéfinie.
                this._server.on('tlsClientError', (err: Error, socket: net.Socket) => {
                    console.error('[Phive TLS Error] Handshake failed:', err.message);
                    socket.destroy();
                });

                this._server.listen(publicPort, '0.0.0.0', () => {
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    public stop(): void {
        if (this._server) {
            this._server.close();
            this._server = undefined;
        }
    }
}