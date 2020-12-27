import { Client } from './types/Client';
import rtcConfiguration from './rtcConfiguration';
import {
  isNameMessageModel,
  isTransferMessageModel,
  isActionMessageModel,
  isRTCDescriptionMessageModel,
  isRTCCandidateMessageModel,
  isEncryptedMessageModel,
} from './types/typeChecking';
import {
  ClientModel,
  MessageModel,
  NetworkMessageModel,
  TargetedMessageModel,
  WelcomeMessageModel,
} from './types/Models';
import { MessageType } from './types/MessageType';

export const maxSize = parseInt(process.env.WS_MAX_SIZE) || 65536;
export const noticeText = process.env.NOTICE_TEXT;
export const noticeUrl = process.env.NOTICE_URL;

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
        maxSize,
        noticeText,
        noticeUrl,
      } as WelcomeMessageModel)
    );
  }

  handleMessage(client: Client, message: MessageModel) {
    client.lastSeen = new Date();

    if (isNameMessageModel(message)) {
      client.publicKey = message.publicKey;
      client.setNetworkName(
        message.networkName.toUpperCase(),
        this.sendNetworkMessage
      );
    } else if (
      isActionMessageModel(message) ||
      isRTCDescriptionMessageModel(message) ||
      isRTCCandidateMessageModel(message) ||
      isEncryptedMessageModel(message)
    ) {
      this.sendMessage(client.clientId, message);
    } else if (isTransferMessageModel(message)) {
      // Ensure all previews are data URLs for safety.
      if (
        message.preview &&
        (typeof message.preview !== 'string' ||
          !message.preview.startsWith('data:'))
      ) {
        return;
      }

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

    const network: ClientModel[] = networkClients
      .sort((a, b) => b.firstSeen.getTime() - a.firstSeen.getTime())
      .map(client => {
        return {
          clientId: client.clientId,
          clientColor: client.clientColor,
          publicKey: client.publicKey,
        };
      });

    const networkMessage = JSON.stringify({
      type: MessageType.NETWORK,
      clients: network,
    } as NetworkMessageModel);

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
