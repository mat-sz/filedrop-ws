import WebSocket from 'ws';

import { WSClient } from './WSClient';
import { ClientManager } from './ClientManager';
import { isMessageModel } from './types/typeChecking';

// Configuration
const host = process.env.WS_HOST || '127.0.0.1';
const port = parseInt(process.env.WS_PORT) || 5000;

const wss = new WebSocket.Server({ host: host, port: port });

const clientManager = new ClientManager();

wss.on('connection', (ws, req) => {
  const client = new WSClient(ws, req);
  clientManager.addClient(client);

  ws.on('message', (data: string) => {
    // Prevents DDoS and abuse.
    if (!data || data.length > 1024) return;

    try {
      const message = JSON.parse(data);

      if (isMessageModel(message)) {
        clientManager.handleMessage(client, message);
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    clientManager.removeClient(client);
  });
});

setInterval(() => {
  clientManager.removeBrokenClients();
}, 1000);

// Ping clients to keep the connection alive (when behind nginx)
setInterval(() => {
  clientManager.pingClients();
}, 5000);

setInterval(() => {
  clientManager.removeInactiveClients();
}, 10000);

console.log('Server running');
