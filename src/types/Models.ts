import { MessageType, ActionMessageActionType } from './MessageType';

export interface ClientModel {
  clientId: string;
  clientColor: string;
}

export interface MessageModel {
  type: MessageType;
}

export interface TargetedMessageModel extends MessageModel {
  targetId: string;
}

export interface WelcomeMessageModel extends MessageModel {
  type: MessageType.WELCOME;
  clientId: string;
  clientColor: string;
  suggestedName: string;
  rtcConfiguration?: any;
}

export interface NameMessageModel extends MessageModel {
  type: MessageType.NAME;
  networkName: string;
}

export interface TransferMessageModel extends TargetedMessageModel {
  type: MessageType.TRANSFER;
  transferId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  clientId?: string;
}

export interface ActionMessageModel extends TargetedMessageModel {
  type: MessageType.ACTION;
  transferId: string;
  action: ActionMessageActionType;
  clientId?: string;
}

export interface NetworkMessageModel extends MessageModel {
  type: MessageType.NETWORK;
  clients: ClientModel[];
}

export interface PingMessageModel extends MessageModel {
  type: MessageType.PING;
  timestamp: number;
}

export interface RTCDescriptionMessageModel extends TargetedMessageModel {
  type: MessageType.RTC_DESCRIPTION;
  data: any;
  transferId: string;
  clientId?: string;
}

export interface RTCCandidateMessageModel extends TargetedMessageModel {
  type: MessageType.RTC_CANDIDATE;
  data: any;
  transferId: string;
  clientId?: string;
}
