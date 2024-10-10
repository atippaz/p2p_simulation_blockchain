export interface NewBlockRequest {
  voter: string;
  candidate: string;
  voteDate: Date;
  personalId: string;
}
export enum COMMUICATE {
  JOINCHAIN,
  ACCEPTTOJOIN,
  SYNC_REQUEST,
  SYNC_RESPONSE,
  REQUESTPEERLIST,
  RESPONSEPEERLIST,
}
export interface CommunicateMessage<T = any> {
  type: COMMUICATE;
  data: T;
}
export interface AcceptJoin {
  nodeId: string;
}
export interface NewConnectionRequest {
  ip: string;
  port: number;
}
export interface AddressIp {
  ip?: string;
  port?: number;
  nodeId?: string;
}
