import * as crypto from "crypto";
import * as net from "net";
import { AcceptJoin, COMMUICATE, CommunicateMessage, NewConnectionRequest } from "./interface";
import { setupManageResponseConnection } from "./p2pController/response";
import { Context } from ".";
import { Blockchain } from "../blockchain/blockchain";
export class AddressConnection {
    nodeId?: string = undefined;
    connection: net.Socket
    port: number
    constructor(connection: net.Socket,
        blockchain: Blockchain,
        context: Context,
        peerPort: number,
        peerAddress: string,
        port: number,
        getPeer: boolean = false) {
        this.port = port
        this.connection = connection
        this.connection.connect(+peerPort, peerAddress, () => {
            if (getPeer) {
                this.connection.write(JSON.stringify({
                    data: { ip: this.connection.localAddress, port: this.port },
                    type: COMMUICATE.JOINCHAIN,
                } as CommunicateMessage<NewConnectionRequest>));

            }
            setupManageResponseConnection({
                blockchain: blockchain,
                context: context,
                socket: this.connection,
                port: this.port
            })
            // this.connection.on("data", async (data) => {
            //     const response: CommunicateMessage = JSON.parse(data.toString());
            //     if (response.type === COMMUICATE.ACCEPTTOJOIN) {
            //         this.nodeId = (response.data as AcceptJoin).nodeId;
            //         this.connection.write(JSON.stringify({
            //             type: COMMUICATE.REQUESTPEERLIST,
            //             data: { nodeId: this.nodeId },
            //         }));
            //     }
            // });
        });
    }
}