import { Client } from './Client';
import rtcConfiguration from './rtcConfiguration';

const allowedActions = ['accept', 'reject', 'cancel'];

export class ClientManager {
  private clients: Client[] = [];

  constructor() {
    this.sendNetworkMessage = this.sendNetworkMessage.bind(this);
  }

  addClient(client: Client) {
    const localClients = this.getLocalClients(client);

    let suggestedName = null;
    if (localClients.length > 0) {
      suggestedName = localClients[0].networkName;
    }

    this.clients.push(client);

    client.send(
      JSON.stringify({
        type: 'welcome',
        clientId: client.clientId,
        clientColor: client.clientColor,
        suggestedName: suggestedName,
        rtcConfiguration: rtcConfiguration(client.clientId),
      })
    );
  }

  handleMessage(client: Client, message: any) {
    client.lastSeen = new Date();

    switch (message.type) {
      case 'name':
        if (message.networkName && typeof message.networkName === 'string') {
          client.setNetworkName(
            message.networkName.toUpperCase(),
            this.sendNetworkMessage
          );
        }
        break;
      case 'transfer':
        if (
          message.transferId &&
          typeof message.transferId === 'string' &&
          message.fileName &&
          typeof message.fileName === 'string' &&
          message.fileSize &&
          typeof message.fileSize === 'number' &&
          message.fileType &&
          typeof message.fileType === 'string' &&
          message.targetId &&
          typeof message.targetId === 'string'
        ) {
          this.sendMessage(client.clientId, message);
        }
        break;
      case 'action':
        if (
          message.transferId &&
          typeof message.transferId === 'string' &&
          message.action &&
          typeof message.action === 'string' &&
          message.targetId &&
          typeof message.targetId === 'string' &&
          allowedActions.includes(message.action)
        ) {
          this.sendMessage(client.clientId, message);
        }
        break;
      case 'rtcDescription':
        if (
          message.data &&
          typeof message.data === 'object' &&
          message.data.type &&
          typeof message.data.type === 'string' &&
          message.data.sdp &&
          typeof message.data.sdp === 'string' &&
          message.targetId &&
          typeof message.targetId === 'string' &&
          message.transferId &&
          typeof message.transferId === 'string'
        ) {
          this.sendMessage(client.clientId, message);
        }
        break;
      case 'rtcCandidate':
        if (
          message.data &&
          typeof message.data === 'object' &&
          message.targetId &&
          typeof message.targetId === 'string' &&
          message.transferId &&
          typeof message.transferId === 'string'
        ) {
          this.sendMessage(client.clientId, message);
        }
        break;
    }
  }

  sendMessage(fromClientId: string, message: any) {
    if (!message.targetId || message.targetId === fromClientId) {
      return;
    }

    const data = JSON.stringify({
      ...message,
      clientId: fromClientId,
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
