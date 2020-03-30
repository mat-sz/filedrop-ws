import WebSocket from 'ws';

import rtcConfiguration from './rtcConfiguration';
import { Client } from './Client';
import { ClientManager } from './ClientManager';

// Configuration
const host = process.env.WS_HOST || '127.0.0.1';
const port = parseInt(process.env.WS_PORT) || 5000;

const wss = new WebSocket.Server({ host: host, port: port });

const clientManager = new ClientManager();

wss.on('connection', (ws, req) => {
  const client = new Client(ws, req);

  const localClients = clientManager.getLocalClients(client);

  let suggestedName = null;
  if (localClients.length > 0) {
    suggestedName = localClients[0].networkName;
  }

  clientManager.addClient(client);

  ws.send(
    JSON.stringify({
      type: 'welcome',
      clientId: client.clientId,
      clientColor: client.clientColor,
      suggestedName: suggestedName,
      rtcConfiguration: rtcConfiguration(client.clientId),
    })
  );

  ws.on('message', (data: string) => {
    // Prevents DDoS and abuse.
    if (!data || data.length > 1024) return;

    try {
      const json = JSON.parse(data);

      if (json && json.type && typeof json.type === 'string') {
        clientManager.handleMessage(client, json);
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
