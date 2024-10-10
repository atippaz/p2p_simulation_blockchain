const peers: string[] = [];
import { Block, Blockchain } from "./class";
import * as net from "net";
import {
  AcceptJoin,
  AddressIp,
  COMMUICATE,
  CommunicateMessage,
  NewConnectionRequest,
} from "./interface";
import {
  setupConnectToOtherNode,
  setupManageIncommingConnection,
} from "./p2pController";
export class Context {
  port: number;
  peerList: AddressIp[];
  nodeId: string;
  ip: string;
  constructor(port: number, peerlist: AddressIp[], nodeId: string, ip: string) {
    this.port = port;
    this.peerList = peerlist;
    this.nodeId = nodeId;
    this.ip = ip;
  }
}
export class createNode {
  private server: net.Server;
  private blockChain: Blockchain;
  private context: Context | null = null;
  constructor() {
    this.blockChain = new Blockchain();
    this.server = net.createServer((socket) => {
      setupManageIncommingConnection({
        blockchain: this.blockChain,
        socket: socket,
        context: this.context!,
      });
    });
  }
  start(port: number, peerIp?: string) {
    this.server.listen(port, () => {
      this.context = new Context(port, [], "", "");
      if (peerIp) {
        const ipPort = peerIp.split(":");
        const peerPort = +ipPort[1];
        const peerip = ipPort[0];
        this.context.peerList.push({ ip: peerip, port: peerPort, nodeId: "" });
        setupConnectToOtherNode(this.context);
      }
    });
    setInterval(() => {
      console.log(
        "i am port ",
        this.context!.port,
        " and i have list ",
        this.context!.peerList
      );
    }, 10000);
    return this.server;
  }
  getPeerList() {
    return this.context!.peerList;
  }
  getChainData() {
    return this.blockChain;
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
