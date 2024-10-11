import { Block, Blockchain } from "./class";
import * as net from "net";
import {
    AcceptJoin,
    AddressIp,
    COMMUICATE,
    CommunicateMessage,
    NewConnectionRequest,
} from "./interface";
import { Context } from ".";

// Utility functions
function generateNodeId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

function extractIpAddress(ip: string): string {
    const match = ip.match(/(?:\d{1,3}\.){3}\d{1,3}/);
    return match ? match[0] : ip;
}

function addPeer(context: Context, ip: string, port: number) {
    const nodeId = generateNodeId();
    context.peerList.push({ ip: extractIpAddress(ip), port, nodeId });
    return nodeId;
}

// Main functions
export function setupManageIncomingConnection({
    blockchain,
    socket,
    context,
}: {
    blockchain: Blockchain;
    socket: net.Socket;
    context: Context;
}) {
    socket.on("data", async (data) => {
        const response: CommunicateMessage = JSON.parse(data.toString());

        try {
            await handleMessage(response, context, blockchain, socket);
        } catch (error) {
            blockchain.addBlock(new Block(blockchain.chain.length, new Date().toISOString(), []));
        }
    });

    socket.on("end", () => {
        console.log(`Node on port ${context.port}: Connection closed`);
    });
    socket.on("error", (error: any) => {
        handleRequestPeerList(context)
        console.warn("Connection was reset by the sender.");
    });
}

async function handleMessage(response: CommunicateMessage, context: Context, blockchain: Blockchain, socket: net.Socket) {
    switch (response.type) {
        case COMMUICATE.PEER_CANNOT_CONNECT_REQUEST:
            updatePeerList(context, response.data as AddressIp[]);
            break;

        case COMMUICATE.REQUESTPEERLIST:
            if (context.peerList.some(s => s.nodeId === response.data.nodeId)) {
                await handleRequestPeerList(context);
            }
            break;
        case COMMUICATE.TEST_SAYHI:
            console.log(response.data)
            break;
        case COMMUICATE.JOINCHAIN:
            await handleJoinChain(context, response, socket, blockchain);
            break;

        case COMMUICATE.TERMINATE_REQUEST:
            // await handleTerminateRequest(context, response.data as AddressIp);
            break;

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
}

async function handleRequestPeerList(context: Context) {
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

    if (listFailed.length > 0) {
        console.warn(`Failed to connect to peers: ${JSON.stringify(listFailed)}`);
    }
}

async function handleJoinChain(context: Context, response: CommunicateMessage, socket: net.Socket, blockchain: Blockchain) {
    if (context.peerList.length === 0) {
        addPeer(context, socket.localAddress!, socket.localPort!);
        context.nodeId = context.peerList[0].nodeId!;
    }

    const newNodeId = addPeer(context, socket.remoteAddress!, response.data.port);
    blockchain.syncChain([response]);

    socket.write(JSON.stringify({
        data: { nodeId: newNodeId },
        type: COMMUICATE.ACCEPTTOJOIN,
    } as CommunicateMessage<AcceptJoin>));
}

async function handleTerminateRequest(context: Context, data: AddressIp) {
    const { nodeId } = data;
    if (context.peerList.some(s => s.nodeId === nodeId)) {
        context.peerList = context.peerList.filter(x => x.nodeId !== nodeId);
        await handleRequestPeerList(context);
    }
}

export function setupConnectToOtherNode(context: Context) {
    const client = new net.Socket();

    client.connect(context.peerList[context.peerList.length - 1].port!, context.peerList[context.peerList.length - 1].ip!, () => {
        client.write(JSON.stringify({
            data: { ip: context.ip, port: context.port },
            type: COMMUICATE.JOINCHAIN,
        } as CommunicateMessage<NewConnectionRequest>));

        client.on("data", async (data) => {
            const response: CommunicateMessage = JSON.parse(data.toString());
            if (response.type === COMMUICATE.ACCEPTTOJOIN) {
                context.nodeId = (response.data as AcceptJoin).nodeId;
                client.write(JSON.stringify({
                    type: COMMUICATE.REQUESTPEERLIST,
                    data: { nodeId: context.nodeId },
                }));
                client.end();
            }
        });
    });
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
