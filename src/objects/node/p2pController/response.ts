import { Block } from "../../blockchain/block";
import { Blockchain } from "../../blockchain/blockchain";
import { Context } from "../../node";
import { AddressConnection } from "../addressConnection";
import { AddressIp, COMMUICATE, CommunicateMessage } from "../interface";
import * as net from 'net'
export function setupManageResponseConnection({
    blockchain,
    context,
    socket,
}: {
    blockchain: Blockchain;
    context: Context;
    socket: net.Socket
}) {
    console.log('init response')
    if (!socket) {
        console.log('wtf')
        return
    }
    socket.on("data", async (data) => {
        const response: CommunicateMessage = JSON.parse(data.toString());

        try {
            await handleMessage(response, context, blockchain);
        } catch (error) {
            console.log(error)
            blockchain.addBlock(new Block(blockchain.chain.length, new Date().toISOString(), []));
        }
    });

    socket.on("end", () => {
        console.log(`Node on port ${context.socket!.localPort}: Connection closed`);
    });
    socket.on("error", (error: any) => {
        // handleRequestPeerList(context)
        console.warn("Connection was reset by the sender.");
    });
    async function handleMessage(response: CommunicateMessage, context: Context, blockchain: Blockchain) {
        switch (response.type) {
            case COMMUICATE.RESPONSEPEERLIST:
            case COMMUICATE.TERMINATE_RESPONSE:
                updatePeerList(context, response.data as AddressIp[]);
                break;

            default:
                throw new Error("Unknown message type");
        }
    }
    function updatePeerList(context: Context, newPeers: AddressIp[]) {
        context.peerList = context.peerList.length <= 1
            ? newPeers
            : [...context.peerList, ...newPeers.filter(x => !context.peerList.some(t => t.nodeId === x.nodeId))];
        const newConnection = context.peerList.filter(x => context.connection.some(s => s.nodeId != x.nodeId) && x.nodeId != context.nodeId)
        newConnection.forEach(peer => {
            const client = new net.Socket()
            context.connection.push(new AddressConnection(client, blockchain, context, peer.port!, peer.ip!))
        })
        // const removeConnection = context.peerList.filter(x=>context.connection.some(s=>s.nodeId!=x.nodeId))

    }
}



// async function handleRequestPeerList(context: Context) {
//     let listFailed: AddressIp[] = [];
//     let attemptCount = 0;
//     const maxAttempts = 5;

//     do {
//         listFailed = await broadcastToPeers(
//             context.peerList.filter(x => x.nodeId !== context.nodeId),
//             {
//                 data: context.peerList,
//                 type: COMMUICATE.RESPONSEPEERLIST,
//             }
//         );

//         context.peerList = context.peerList.filter(x => !listFailed.some(s => s.nodeId === x.nodeId));
//         attemptCount++;
//     } while (listFailed.length > 0 && attemptCount < maxAttempts);

//     if (listFailed.length > 0) {
//         console.warn(`Failed to connect to peers: ${JSON.stringify(listFailed)}`);
//     }
// }


// export async function broadcastToPeers(peers: AddressIp[], message: CommunicateMessage, excludePort?: number) {
//     const listIpCannotConnect: AddressIp[] = [];

//     const promises = peers.map((peer) => {
//         if (Number(peer.port) !== excludePort) {
//             const client = new net.Socket();
//             return new Promise<void>((resolve) => {
//                 client.connect(Number(peer.port), peer.ip!, () => {
//                     client.write(JSON.stringify(message));
//                     client.end();
//                     resolve();
//                 });

//                 client.on('error', () => {
//                     listIpCannotConnect.push({
//                         ip: peer.ip,
//                         nodeId: peer.nodeId,
//                         port: peer.port,
//                     });
//                     resolve();
//                 });
//             });
//         }
//     });
//     try {
//         await Promise.allSettled(promises);
//     }
//     catch (ex: any) {
//         console.log(ex)
//     }
//     return listIpCannotConnect;
// }
