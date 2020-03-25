import WebSocket from 'ws';

import rtcConfiguration from './rtcConfiguration';
import { Client } from './client';

// Configuration
const host = process.env.WS_HOST || '127.0.0.1';
const port = parseInt(process.env.WS_PORT) || 5000;

const wss = new WebSocket.Server({ host: host, port: port });

const allowedActions = ['accept', 'reject', 'cancel'];
let clients: Client[] = [];

function networkMessage(networkName: string) {
  const networkClients = clients.filter(
    client => client.networkName === networkName
  );
  const network = networkClients
    .sort((a, b) => b.firstSeen.getTime() - a.firstSeen.getTime())
    .map(client => {
      return {
        clientId: client.clientId,
        clientColor: client.clientColor,
      };
    });

  const networkMessage = JSON.stringify({
    type: 'network',
    clients: network,
  });

  networkClients.forEach(client => {
    try {
      client.send(networkMessage);
    } catch {}
  });
}

function sendMessage(clientId: string, message: any) {
  if (!message.targetId || message.targetId === clientId) {
    return;
  }

  const data = JSON.stringify({
    ...message,
    clientId: clientId,
  });

  const targets = clients.filter(c => c.clientId === message.targetId);
  targets.forEach(client => client.send(data));
}

function removeClient(client: Client) {
  client.setNetworkName(null, networkMessage);
  clients = clients.filter(c => c !== client);
}

wss.on('connection', (ws, req) => {
  const client = new Client(ws, req);

  const localClients = clients
    .filter(c => c.remoteAddress === client.remoteAddress && c.networkName)
    .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

  let suggestedName = null;
  if (localClients.length > 0) {
    suggestedName = localClients[0].networkName;
  }

  clients.push(client);

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
    client.lastSeen = new Date();

    // Prevents DDoS and abuse.
    if (!data || data.length > 1024) return;

    try {
      const json = JSON.parse(data);

      if (json && json.type && typeof json.type === 'string') {
        switch (json.type) {
          case 'name':
            if (json.networkName && typeof json.networkName === 'string') {
              client.setNetworkName(
                json.networkName.toUpperCase(),
                networkMessage
              );
            }
            break;
          case 'transfer':
            if (
              json.transferId &&
              typeof json.transferId === 'string' &&
              json.fileName &&
              typeof json.fileName === 'string' &&
              json.fileSize &&
              typeof json.fileSize === 'number' &&
              json.fileType &&
              typeof json.fileType === 'string' &&
              json.targetId &&
              typeof json.targetId === 'string'
            ) {
              sendMessage(client.clientId, json);
            }
            break;
          case 'action':
            if (
              json.transferId &&
              typeof json.transferId === 'string' &&
              json.action &&
              typeof json.action === 'string' &&
              json.targetId &&
              typeof json.targetId === 'string' &&
              allowedActions.includes(json.action)
            ) {
              sendMessage(client.clientId, json);
            }
            break;
          case 'rtcDescription':
            if (
              json.data &&
              typeof json.data === 'object' &&
              json.data.type &&
              typeof json.data.type === 'string' &&
              json.data.sdp &&
              typeof json.data.sdp === 'string' &&
              json.targetId &&
              typeof json.targetId === 'string' &&
              json.transferId &&
              typeof json.transferId === 'string'
            ) {
              sendMessage(client.clientId, json);
            }
            break;
          case 'rtcCandidate':
            if (
              json.data &&
              typeof json.data === 'object' &&
              json.targetId &&
              typeof json.targetId === 'string' &&
              json.transferId &&
              typeof json.transferId === 'string'
            ) {
              sendMessage(client.clientId, json);
            }
            break;
        }
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    removeClient(client);
  });
});

setInterval(() => {
  clients = clients.filter(client => {
    if (client.readyState <= 1) {
      return true;
    } else {
      client.setNetworkName(null, networkMessage);
      return false;
    }
  });
}, 1000);

// Ping clients to keep the connection alive (when behind nginx)
setInterval(() => {
  const pingMessage = JSON.stringify({
    type: 'ping',
    timestamp: new Date().getTime(),
  });

  clients.forEach(client => {
    if (client.readyState !== 1) return;

    try {
      client.send(pingMessage);
    } catch {
      removeClient(client);
      client.close();
    }
  });
}, 5000);

// Remove inactive connections
setInterval(() => {
  const minuteAgo = new Date(Date.now() - 1000 * 20);

  clients.forEach(client => {
    if (client.readyState !== 1) return;

    if (client.lastSeen < minuteAgo) {
      removeClient(client);
      client.close();
    }
  });
}, 10000);

console.log('Server running');
