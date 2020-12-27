import {
  MessageModel,
  NameMessageModel,
  TransferMessageModel,
  ActionMessageModel,
  RTCDescriptionMessageModel,
  RTCCandidateMessageModel,
  EncryptedMessageModel,
} from './Models';
import { MessageType, ActionMessageActionType } from './MessageType';

export function isMessageModel(message: any): message is MessageModel {
  return message && 'type' in message && typeof message['type'] === 'string';
}

export function isNameMessageModel(
  message: MessageModel
): message is NameMessageModel {
  return (
    message.type === MessageType.NAME &&
    'networkName' in message &&
    typeof message['networkName'] === 'string'
  );
}

export function isTransferMessageModel(
  message: MessageModel
): message is TransferMessageModel {
  return (
    message.type === MessageType.TRANSFER &&
    'transferId' in message &&
    typeof message['transferId'] === 'string' &&
    'fileName' in message &&
    typeof message['fileName'] === 'string' &&
    'fileSize' in message &&
    typeof message['fileSize'] === 'number' &&
    'fileType' in message &&
    typeof message['fileType'] === 'string' &&
    'targetId' in message &&
    typeof message['targetId'] === 'string'
  );
}

export function isActionMessageModel(
  message: MessageModel
): message is ActionMessageModel {
  return (
    message.type === MessageType.ACTION &&
    'transferId' in message &&
    typeof message['transferId'] === 'string' &&
    'action' in message &&
    typeof message['action'] === 'string' &&
    'targetId' in message &&
    typeof message['targetId'] === 'string' &&
    Object.values(ActionMessageActionType).includes(message['action'])
  );
}

export function isRTCDescriptionMessageModel(
  message: MessageModel
): message is RTCDescriptionMessageModel {
  return (
    message.type === MessageType.RTC_DESCRIPTION &&
    'data' in message &&
    typeof message['data'] === 'object' &&
    'type' in message['data'] &&
    typeof message['data']['type'] === 'string' &&
    'sdp' in message['data'] &&
    typeof message['data']['sdp'] === 'string' &&
    'targetId' in message &&
    typeof message['targetId'] === 'string' &&
    'transferId' in message &&
    typeof message['transferId'] === 'string'
  );
}

export function isRTCCandidateMessageModel(
  message: MessageModel
): message is RTCCandidateMessageModel {
  return (
    message.type === MessageType.RTC_CANDIDATE &&
    'data' in message &&
    typeof message['data'] === 'object' &&
    'targetId' in message &&
    typeof message['targetId'] === 'string' &&
    'transferId' in message &&
    typeof message['transferId'] === 'string'
  );
}

export function isEncryptedMessageModel(
  message: MessageModel
): message is EncryptedMessageModel {
  return (
    message.type === MessageType.ENCRYPTED &&
    'payload' in message &&
    typeof message['payload'] === 'string' &&
    'targetId' in message &&
    typeof message['targetId'] === 'string'
  );
}
