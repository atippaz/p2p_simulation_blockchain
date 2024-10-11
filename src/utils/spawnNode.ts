import * as net from "net";

import readline from 'readline'
import { findAvailablePort } from "./generateUniquePort";
import { CreateNode } from "../objects/node";
import { AddressIp, COMMUICATE } from "../objects/node/interface";
import { broadcastToPeers } from "../objects/node/p2pController/request";
function inputLoop(peerList: AddressIp[], port: number) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.on("line", async (input) => {
        let listFailed: AddressIp[] = [];
        let attemptCount = 0;
        const maxAttempts = 5;

        do {
            listFailed = await broadcastToPeers(
                peerList.filter(x => x.port !== port),
                {
                    data: "test from " + port + "data " + input as string,
                    type: COMMUICATE.TEST_SAYHI,
                }
            );

            // peerList = context.peerList.filter(x => !listFailed.some(s => s.nodeId === x.nodeId));
            attemptCount++;
        } while (listFailed.length > 0 && attemptCount < maxAttempts);

        if (listFailed.length > 0) {
            console.warn(`Failed to connect to peers: ${JSON.stringify(listFailed)}`);
        }

        // blockchain.addBlock(
        //     new Block(blockchain.chain.length, new Date().toISOString(), input)
        // );
        // console.log(`Node on port ${port}: Added block with data: ${input}`);
        // broadcastBlockchain(); 
    });
}

async function main() {
    const portIpSeedNode = process.argv[2]
    const port = await findAvailablePort()
    const node = new CreateNode()
    node.start(port, portIpSeedNode);
    setInterval(() => {
        console.log(node.getPeerList())
    }, 1000);
    process.on('SIGINT', async () => {
        console.log('Received SIGINT. Terminating...');
        await node.terminate();
        process.exit();
    });

    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM. Terminating...');
        await node.terminate();
        process.exit();
    });
    setTimeout(() => {
        inputLoop(node.getPeerList(), port)
    }, 1000);
}


main()