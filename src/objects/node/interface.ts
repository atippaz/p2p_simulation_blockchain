
export enum COMMUICATE {
    JOINCHAIN,
    ACCEPTTOJOIN,
    SYNC_REQUEST,
    SYNC_RESPONSE,
    REQUESTPEERLIST,
    RESPONSEPEERLIST,
    TERMINATE_REQUEST,
    TERMINATE_RESPONSE,
    PEER_CANNOT_CONNECT_REQUEST,
    PEER_CANNOT_CONNECT_RESPONSE,
    TEST_SAYHI
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
