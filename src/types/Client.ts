export interface Client {
  readonly clientId: string;
  readonly clientColor: string;
  clientName?: string;
  readonly firstSeen: Date;
  lastSeen: Date;
  readonly remoteAddress?: string;
  networkName?: string;
  readonly readyState: number;
  publicKey?: string;

  send(data: string): void;
  close(): void;
}
