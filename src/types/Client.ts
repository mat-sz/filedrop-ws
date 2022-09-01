export interface Client {
  readonly clientId: string;
  readonly clientColor: string;
  clientName: string | null;
  readonly firstSeen: Date;
  lastSeen: Date;
  readonly remoteAddress?: string;
  networkName: string | null;
  readonly readyState: number;
  publicKey?: string;

  setNetworkName(
    networkName: string | null,
    clientName: string | null,
    networkMessage: (name: string) => void
  ): void;
  send(data: string): void;
  close(): void;
}
