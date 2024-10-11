import * as net from "net";
import { Context } from "..";
import { Blockchain } from "../../blockchain/blockchain";
import { AcceptJoin, AddressIp, COMMUICATE, CommunicateMessage } from "../interface";
import { Block } from "../../blockchain/block";
import { extractIpAddress, generateNodeId } from "../../../utils/utils";

function addPeer(context: Context, ip: string, port: number) {
    const nodeId = generateNodeId();
    context.peerList.push({ ip: extractIpAddress(ip), port, nodeId });
    return nodeId;
}

// Main functions
export function setupManageIncomingConnection({
    blockchain,
    context,
}: {
    blockchain: Blockchain;
    context: Context;
}) {
    context.socket!.on("data", async (data) => {
        const response: CommunicateMessage = JSON.parse(data.toString());
        try {
            await handleMessage(context.socket!, response, context, blockchain);
        } catch (error) {
            blockchain.addBlock(new Block(blockchain.chain.length, new Date().toISOString(), []));
        }
    });
    context.socket!.on("end", () => {
        console.log(`Node on port ${context.socket!.localPort}: Connection closed`);
    });
    context.socket!.on("error", (error: any) => {
        handleRequestPeerList(context.socket!, context)
        console.warn("Connection was reset by the sender.");
    });
}

async function handleMessage(server: net.Socket, response: CommunicateMessage, context: Context, blockchain: Blockchain) {
    switch (response.type) {
        case COMMUICATE.PEER_CANNOT_CONNECT_REQUEST:
            updatePeerList(context, response.data as AddressIp[]);
            break;

        case COMMUICATE.REQUESTPEERLIST:
            if (context.peerList.some(s => s.nodeId === response.data.nodeId)) {
                await handleRequestPeerList(server, context);
            }
            break;
        case COMMUICATE.TEST_SAYHI:
            console.log(response.data)
            break;
        case COMMUICATE.JOINCHAIN:
            await handleJoinChain(context, response, blockchain);
            break;

        case COMMUICATE.TERMINATE_REQUEST:
            await handleTerminateRequest(server, context, response.data as AddressIp);
            break;

        default:
            throw new Error("Unknown message type");
    }
}

function updatePeerList(context: Context, newPeers: AddressIp[]) {
    context.peerList = context.peerList.length <= 1
        ? newPeers
        : [...context.peerList, ...newPeers.filter(x => !context.peerList.some(t => t.nodeId === x.nodeId))];
}

async function handleRequestPeerList(server: net.Socket, context: Context) {
    let listFailed: AddressIp[] = [];
    let attemptCount = 0;
    const maxAttempts = 5;

    do {
        listFailed = await broadcastToPeers(
            context.peerList.filter(x => x.nodeId !== context.nodeId),
            {
                data: context.peerList,
                type: COMMUICATE.RESPONSEPEERLIST,
            }
        );

        context.peerList = context.peerList.filter(x => !listFailed.some(s => s.nodeId === x.nodeId));
        attemptCount++;
    } while (listFailed.length > 0 && attemptCount < maxAttempts);
    server.write(JSON.stringify({
        data: context.peerList,
        type: COMMUICATE.RESPONSEPEERLIST,
    }))
    if (listFailed.length > 0) {
        console.warn(`Failed to connect to peers: ${JSON.stringify(listFailed)}`);
    }
}

async function handleJoinChain(context: Context, response: CommunicateMessage, blockchain: Blockchain) {
    if (context.peerList.length === 0) {
        addPeer(context, context.socket!.localAddress!, context.socket!.localPort!);
        context.nodeId = context.peerList[0].nodeId!;
    }

    const newNodeId = addPeer(context, context.socket!.remoteAddress!, response.data.port);
    blockchain.syncChain([response]);

    context.socket!.write(JSON.stringify({
        data: { nodeId: newNodeId },
        type: COMMUICATE.ACCEPTTOJOIN,
    } as CommunicateMessage<AcceptJoin>));
}

async function handleTerminateRequest(server: net.Socket, context: Context, data: AddressIp) {
    const { nodeId } = data;
    if (context.peerList.some(s => s.nodeId === nodeId)) {
        context.peerList = context.peerList.filter(x => x.nodeId !== nodeId);
        await handleRequestPeerList(server, context);
    }
}



export async function broadcastToPeers(peers: AddressIp[], message: CommunicateMessage, excludePort?: number) {
    const listIpCannotConnect: AddressIp[] = [];

    const promises = peers.map((peer) => {
        if (Number(peer.port) !== excludePort) {
            const client = new net.Socket();
            return new Promise<void>((resolve) => {
                client.connect(Number(peer.port), peer.ip!, () => {
                    client.write(JSON.stringify(message));
                    client.end();
                    resolve();
                });

                client.on('error', () => {
                    listIpCannotConnect.push({
                        ip: peer.ip,
                        nodeId: peer.nodeId,
                        port: peer.port,
                    });
                    resolve();
                });
            });
        }
    });
    try {
        await Promise.allSettled(promises);
    }
    catch (ex: any) {
        console.log(ex)
    }
    return listIpCannotConnect;
}
