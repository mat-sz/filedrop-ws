export interface Client {
  readonly clientId: string;
  readonly clientColor: string;
  readonly firstSeen: Date;
  lastSeen: Date;
  readonly remoteAddress: string;
  networkName: string;
  readonly readyState: number;

  setNetworkName(
    networkName: string,
    networkMessage: (name: string) => void
  ): void;
  send(data: string): void;
  close(): void;
}
