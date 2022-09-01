import { MessageType, ActionMessageActionType } from './MessageType';

export interface ClientModel {
  clientId: string;
  clientName?: string;
  clientColor: string;
  publicKey?: string;
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
  clientName: string;
  suggestedNetworkName?: string;
  localNetworkNames: string[];
  rtcConfiguration?: any;
  maxSize: number;
  noticeText?: string;
  noticeUrl?: string;
}

export interface LocalNetworksMessageModel extends MessageModel {
  type: MessageType.LOCAL_NETWORKS;
  localNetworkNames: string[];
}

export interface NameMessageModel extends MessageModel {
  type: MessageType.NAME;
  clientName?: string;
  networkName: string;
  publicKey?: string;
}

export interface TransferMessageModel extends TargetedMessageModel {
  type: MessageType.TRANSFER;
  transferId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  clientId?: string;
  preview?: string;
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

export interface EncryptedMessageModel extends TargetedMessageModel {
  type: MessageType.ENCRYPTED;
  payload: string;
  secret: string;
  clientId?: string;
}
