import { Client } from './types/Client';
import rtcConfiguration from './rtcConfiguration';
import {
  isNameMessageModel,
  isTransferMessageModel,
  isActionMessageModel,
  isRTCDescriptionMessageModel,
  isRTCCandidateMessageModel,
} from './types/typeChecking';
import { MessageModel, TargetedMessageModel } from './types/Models';
import { MessageType } from './types/MessageType';

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
        type: MessageType.WELCOME,
        clientId: client.clientId,
        clientColor: client.clientColor,
        suggestedName: suggestedName,
        rtcConfiguration: rtcConfiguration(client.clientId),
      })
    );
  }

  handleMessage(client: Client, message: MessageModel) {
    client.lastSeen = new Date();

    if (isNameMessageModel(message)) {
      client.setNetworkName(
        message.networkName.toUpperCase(),
        this.sendNetworkMessage
      );
    } else if (
      isTransferMessageModel(message) ||
      isActionMessageModel(message) ||
      isRTCDescriptionMessageModel(message) ||
      isRTCCandidateMessageModel(message)
    ) {
      this.sendMessage(client.clientId, message);
    }
  }

  sendMessage(fromClientId: string, message: TargetedMessageModel) {
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
      type: MessageType.NETWORK,
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
      type: MessageType.PING,
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
