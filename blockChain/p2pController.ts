import { Block, Blockchain, } from "./class";
import * as net from 'net'
import { AcceptJoin, AddressIp, COMMUICATE, CommunicateMessage, NewConnectionRequest } from "./interface";
// function broadcastToPeers(message: string, excludePort?: number) {
//     peers.forEach((peer) => {
//       const [peerIp, peerPort] = peer.split(":");
//       if (Number(peerPort) !== excludePort) {
//         const client = new net.Socket();
//         client.connect(Number(peerPort), peerIp, () => {
//           client.write(message);
//           client.end();
//         });
//       }
//     });
//   }

//   function broadcastBlockchain() {
//     const chainData = JSON.stringify(blockchain.chain);
//     broadcastToPeers(chainData);
//   }

export function setupManageIncommingConnection({ blockchain, socket, port, ip }: { blockchain: Blockchain, socket: net.Socket, port: number, ip: string }) {
    const splitIp = socket.remoteAddress?.split(":") || [];
    const clientIp = splitIp[splitIp.length - 1];
    const clientPort = socket.remotePort;
    socket.on("data", (data) => {
        console.log("i am port :", port);
        const message = data.toString();

        try {
            const receivedChain: Block[] = JSON.parse(message);
            blockchain.syncChain(receivedChain);
        } catch (error) {
            blockchain.addBlock(
                new Block(blockchain.chain.length, new Date().toISOString(), [])
            );
        }
        socket.write(
            JSON.stringify({ message: "hi " + clientIp + ":" + clientPort })
        );
        // broadcastBlockchain();
    });

    socket.on("end", () => {
        console.log(`Node on port ${port}: Connection closed`);
    });
}
export function setupConnectToOtherNode({
    port, ip, peerList, nodeId
}: { port: number, ip: string, peerList: AddressIp[], nodeId: string }) {
    const client = new net.Socket();

    client.connect(peerList[peerList.length - 1].port!, peerList[peerList.length - 1].ip!, () => {
        client.write(
            JSON.stringify({
                data: {
                    ip: ip,
                    port: port,
                },
                type: COMMUICATE.JOINCHAIN,
            } as CommunicateMessage<NewConnectionRequest>)
        );
        client.on("data", (data) => {
            console.log(
                "i am port: ",
                port,
                " i recipt some response form ",
                data
            );
            const response = JSON.parse(data.toString()) as CommunicateMessage;
            if (response.type === COMMUICATE.ACCEPTTOJOIN) {
                console.log(response.data);
                nodeId = ((response.data as AcceptJoin).nodeId);
            }
            client.end();
        });
    });

}
