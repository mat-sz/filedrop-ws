import WebSocket from 'ws';
import { IncomingMessage } from 'http';

import { Client } from './Client';

export class ClientManager {
  private clients: Client[] = [];

  constructor() {
    this.sendNetworkMessage = this.sendNetworkMessage.bind(this);
  }

  addClient(client: Client) {
    this.clients.push(client);
  }

  sendMessage(clientId: string, message: any) {
    if (!message.targetId || message.targetId === clientId) {
      return;
    }

    const data = JSON.stringify({
      ...message,
      clientId: clientId,
    });

    const targets = this.clients.filter(c => c.clientId === message.targetId);
    targets.forEach(client => client.send(data));
  }

  sendNetworkMessage(networkName: string) {
    const networkClients = this.clients.filter(
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

  getLocalClients(client: Client) {
    return this.clients
      .filter(c => c.remoteAddress === client.remoteAddress && c.networkName)
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  pingClients() {
    const pingMessage = JSON.stringify({
      type: 'ping',
      timestamp: new Date().getTime(),
    });

    this.clients.forEach(client => {
      if (client.readyState !== 1) return;

      try {
        client.send(pingMessage);
      } catch {
        this.removeClient(client);
        client.close();
      }
    });
  }

  removeClient(client: Client) {
    client.setNetworkName(null, this.sendNetworkMessage);
    this.clients = this.clients.filter(c => c !== client);
  }

  removeBrokenClients() {
    this.clients = this.clients.filter(client => {
      if (client.readyState <= 1) {
        return true;
      } else {
        client.setNetworkName(null, this.sendNetworkMessage);
        return false;
      }
    });
  }

  removeInactiveClients() {
    const minuteAgo = new Date(Date.now() - 1000 * 20);

    this.clients.forEach(client => {
      if (client.readyState !== 1) return;

      if (client.lastSeen < minuteAgo) {
        this.removeClient(client);
        client.close();
      }
    });
  }
}
