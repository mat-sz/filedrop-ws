import { v4 as uuid } from 'uuid';
import randomColor from 'randomcolor';

import { ClientManager } from '../src/ClientManager';
import { Client } from '../src/types/Client';

export class TestClient implements Client {
  readonly clientId = uuid();
  readonly clientColor = randomColor({ luminosity: 'light' });
  readonly firstSeen = new Date();
  lastSeen = new Date();
  remoteAddress: string;
  networkName: string;
  lastMessage: string;
  closed = false;
  readyState = 1;

  setNetworkName(networkName: string, networkMessage: (name: string) => void) {
    const previousName = this.networkName;
    this.networkName = networkName;

    if (previousName) {
      networkMessage(previousName);
    }

    if (networkName) {
      networkMessage(networkName);
    }
  }

  send(data: string) {
    this.lastMessage = data;
  }

  close() {
    this.closed = true;
  }
}

describe('ClientManager', () => {
  it('welcomes the client', async () => {
    const clientManager = new ClientManager();

    const client = new TestClient();
    clientManager.addClient(client);

    expect(JSON.parse(client.lastMessage)).toMatchObject({
      type: 'welcome',
      clientId: client.clientId,
      clientColor: client.clientColor,
    });
  });

  it('keeps track of local clients', async () => {
    const clientManager = new ClientManager();

    const client1 = new TestClient();
    client1.remoteAddress = '127.0.0.1';
    client1.networkName = 'TEST';
    clientManager.addClient(client1);

    const client2 = new TestClient();
    client2.remoteAddress = '127.0.0.2';
    client2.networkName = 'TEST';
    clientManager.addClient(client2);

    const client3 = new TestClient();
    client3.remoteAddress = '127.0.0.1';
    client3.networkName = 'TEST';
    clientManager.addClient(client3);

    expect(clientManager.getLocalClients(client1)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: client1.clientId,
        }),
        expect.objectContaining({
          clientId: client3.clientId,
        }),
      ])
    );
    expect(clientManager.getLocalClients(client2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: client2.clientId,
        }),
      ])
    );

    clientManager.removeClient(client3);
    expect(clientManager.getLocalClients(client1)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: client1.clientId,
        }),
      ])
    );
  });
});
