const peers: string[] = [];
import { Block, Blockchain, } from "./class";
import * as net from "net";
import {
    AcceptJoin,
    AddressIp,
    COMMUICATE,
    CommunicateMessage,
    NewConnectionRequest,
} from "./interface";
import { setupConnectToOtherNode, setupManageIncommingConnection } from "./p2pController";

export class createNode {
    private nodeId: string | undefined
    private port: number | undefined
    private ip: string | undefined
    private server: net.Server
    private peerlist: AddressIp[] = []
    private blockChain: Blockchain
    constructor() {
        this.blockChain = new Blockchain()
        this.server = net.createServer((socket) => {
            this.ip = socket.remoteAddress
            setupManageIncommingConnection({
                blockchain: this.blockChain,
                ip: this.ip!,
                port: this.port!,
                socket: socket
            })
        });
    }
    start(port: number, peerIp?: string) {
        this.port = port
        this.server.listen(port, () => {
            console.log(`Node on port ${''}: Listening on port ${this.port}`);
            if (peerIp) {
                const ipPort = peerIp.split(":");
                const peerPort = +ipPort[1];
                const peerip = ipPort[0];
                this.peerlist.push({ ip: peerip, port: peerPort })
                setupConnectToOtherNode({
                    ip: this.ip!,
                    nodeId: this.nodeId!,
                    peerList: this.peerlist!,
                    port: this.port!
                })
            }
        });
        return this.server;
    }
}

// การอ่านข้อมูลจาก command line เพื่อส่งไปยัง peers
// function inputLoop(port: number) {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   rl.on("line", (input) => {
//     blockchain.addBlock(
//       new Block(blockchain.chain.length, new Date().toISOString(), input)
//     );
//     console.log(`Node on port ${port}: Added block with data: ${input}`);
//     broadcastBlockchain(); // ส่งข้อมูล blockchain ไปยัง peers หลังจากเพิ่มบล็อกใหม่
//   });
// }

// // รัน Node ด้วยการระบุพอร์ต และพอร์ตของเพื่อนถ้ามี
// const port = parseInt(process.argv[2]);
// const peerPort = process.argv[3] ? parseInt(process.argv[3]) : undefined;

// createNode(port, peerPort);
// inputLoop(port)

// export function BlockChainSystem() {
//     const myBlockchain = new Blockchain();
//     return {
//         async addNewBlock(req: newBlockRequest[]) {
//             const transections: Transaction[] = []
//             req.forEach((request) => {
//                 const newTransection = new Transaction(
//                     request.candidate,
//                     request.voteDate,
//                     request.personalId,
//                     request.voter,
//                 )
//                 if (myBlockchain.isCanAddThisTransection(newTransection)) {
//                     transections.push(newTransection)
//                 }
//                 else {
//                     throw new Error('Blockchain is invalid! Transaction aborted.');
//                 }
//             })
//             if (myBlockchain.isChainValid()) {
//                 myBlockchain.createTransaction(transections)
//                 await myBlockchain.minePendingTransactions()
//             }
//             else {
//                 throw new Error('Blockchain is invalid! Transaction aborted.');
//             }
//         },
//         async queryTransactions(query?: { [key in keyof Transaction]?: string[] }): Promise<Transaction[]> {
//             const result: Transaction[] = [];
//             myBlockchain.chain.forEach(block => {
//                 block.data.forEach(transaction => {
//                     let match = true;
//                     for (const key in query) {
//                         if (query[key as keyof Transaction]?.some(s => s !== transaction[key as keyof Transaction])) {
//                             match = false;
//                             break;
//                         }
//                     }
//                     if (match) {
//                         result.push(transaction);
//                     }
//                 });
//             });
//             return result;
//         },
//         getAllChain() {
//             return myBlockchain.chain
//         }
//     }
// }

