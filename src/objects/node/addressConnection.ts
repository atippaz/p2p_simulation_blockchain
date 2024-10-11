import * as crypto from "crypto";
import * as net from "net";
import { AcceptJoin, COMMUICATE, CommunicateMessage, NewConnectionRequest } from "./interface";
export class AddressConnection {
    nodeId?: string = undefined;
    connection: net.Socket
    constructor(connection: net.Socket, peerPort: number, peerAddress: string, getPeer: boolean = false) {
        this.connection = connection
        this.connection.connect(+peerPort, peerAddress, () => {
            if (getPeer) {
                this.connection.write(JSON.stringify({
                    data: { ip: this.connection.localAddress, port: this.connection.localPort },
                    type: COMMUICATE.JOINCHAIN,
                } as CommunicateMessage<NewConnectionRequest>));

            }
            // setupManageResponseConnection()
            this.connection.on("data", async (data) => {
                const response: CommunicateMessage = JSON.parse(data.toString());
                if (response.type === COMMUICATE.ACCEPTTOJOIN) {
                    this.nodeId = (response.data as AcceptJoin).nodeId;
                    this.connection.write(JSON.stringify({
                        type: COMMUICATE.REQUESTPEERLIST,
                        data: { nodeId: this.nodeId },
                    }));
                }
            });
        });
    }
}