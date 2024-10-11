import * as net from "net";

import readline from 'readline'
import { findAvailablePort } from "./generateUniquePort";
import { CreateNode } from "../objects/node";
import { AddressIp, COMMUICATE } from "../objects/node/interface";
import { AddressConnection } from "../objects/node/addressConnection";
function inputLoop(peerList: AddressConnection[], port: number) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.on("line", async (input) => {
        let listFailed: AddressIp[] = [];
        let attemptCount = 0;
        const maxAttempts = 5;

        do {

            // const listIpCannotConnect: AddressIp[] = [];

            const promises = peerList.map((peer) => {

                return new Promise<void>((resolve) => {
                    peer.connection.write(JSON.stringify(input));
                    resolve();

                    // peer.connection.on('error', () => {
                    //     listIpCannotConnect.push({
                    //         ip: peer.ip,
                    //         nodeId: peer.nodeId,
                    //         port: peer.port,
                    //     });
                    //     resolve();
                    // });
                });
            });
            try {
                await Promise.allSettled(promises);
            }
            catch (ex: any) {
                console.log(ex)
            }
            attemptCount++;
            // return listIpCannotConnect;
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
        console.log(node.getConnection())
    }, 3000);
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
        inputLoop(node.getConnection(), port)
    }, 1000);
}


main()