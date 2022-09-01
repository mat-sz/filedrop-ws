import { v4 as uuid } from 'uuid';
import randomColor from 'randomcolor';
import { IncomingMessage } from 'http';
import WebSocket from 'ws';

import { Client } from './types/Client';
import { generateClientName } from './utils/name';

const acceptForwardedFor =
  process.env.WS_BEHIND_PROXY === 'true' ||
  process.env.WS_BEHIND_PROXY === 'yes';

export class WSClient implements Client {
  readonly clientId = uuid();
  readonly clientColor = randomColor({ luminosity: 'light' });
  readonly firstSeen = new Date();
  clientName = generateClientName();
  lastSeen = new Date();
  readonly remoteAddress?: string;
  networkName: string | null = null;

  constructor(private ws: WebSocket, req: IncomingMessage) {
    const address =
      acceptForwardedFor && req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for']
        : req.connection.remoteAddress;
    this.remoteAddress = typeof address === 'string' ? address : address?.[0];
  }

  setNetworkName(
    networkName: string | null,
    clientName: string | null,
    networkMessage: (name: string) => void
  ) {
    const previousNetworkName = this.networkName;
    this.networkName = networkName;

    if (previousNetworkName) {
      networkMessage(previousNetworkName);
    }

    if (networkName) {
      networkMessage(networkName);
    }
  }

  send(data: string) {
    if (this.ws.readyState !== 1) {
      return;
    }

    this.ws.send(data);
  }

  get readyState() {
    return this.ws.readyState;
  }

  close() {
    this.ws.close();
  }
}
