import * as net from "net";
import * as readline from "readline";
import * as crypto from "crypto"; // อย่าลืม import crypto

class Block {
  index: number;
  timestamp: string;
  data: string;
  previousHash: string;
  hash: string;

  constructor(
    index: number,
    timestamp: string,
    data: string,
    previousHash = ""
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(this.index + this.previousHash + this.timestamp + this.data)
      .digest("hex");
  }
}

class Blockchain {
  chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock(): Block {
    return new Block(0, new Date().toISOString(), "Genesis Block", "0");
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock: Block) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  // ฟังก์ชันเช็คและ sync Blockchain
  syncChain(receivedChain: Block[]) {
    if (receivedChain.length > this.chain.length) {
      console.log("Blockchain updated from peer!");
      this.chain = receivedChain;
    } else {
      console.log("Received chain is not longer, no update performed.");
    }
  }

  // ฟังก์ชันนับจำนวนบล็อกใน chain
  getBlockCount(): number {
    return this.chain.length;
  }
}

const blockchain = new Blockchain();
const peers: string[] = []; // เก็บรายการ peers ทั้งหมด

function broadcastToPeers(message: string, excludePort?: number) {
  peers.forEach((peer) => {
    const [peerIp, peerPort] = peer.split(":");
    if (Number(peerPort) !== excludePort) {
      const client = new net.Socket();
      client.connect(Number(peerPort), peerIp, () => {
        client.write(message);
        client.end();
      });
    }
  });
}

// ฟังก์ชัน broadcast Blockchain ล่าสุดไปยัง peers
function broadcastBlockchain() {
  const chainData = JSON.stringify(blockchain.chain);
  broadcastToPeers(chainData); // ส่ง Blockchain ทั้งหมดไปให้ peers
}

// ฟังก์ชันสร้าง Server สำหรับ Node
function createNode(port: number, peerPort?: number) {
  const server = net.createServer((socket) => {
    console.log(`Node on port ${port}: New connection established`);

    socket.on("data", (data) => {
      const message = data.toString();

      try {
        const receivedChain: Block[] = JSON.parse(message);
        console.log(
          `Node on port ${port}: Received Blockchain from peer with ${receivedChain.length} blocks`
        );
        blockchain.syncChain(receivedChain);
      } catch (error) {
        console.log(`Node on port ${port}: Received message: ${message}`);
        blockchain.addBlock(
          new Block(blockchain.chain.length, new Date().toISOString(), message)
        );
        broadcastBlockchain();
      }

      console.log(
        `Node on port ${port}: Blockchain updated: ${JSON.stringify(
          blockchain.chain
        )}`
      );
    });

    socket.on("end", () => {
      console.log(`Node on port ${port}: Connection closed`);
    });
  });

  // เริ่มฟังที่พอร์ตที่กำหนด
  server.listen(port, () => {
    console.log(`Node on port ${port}: Listening on port ${port}`);

    // ถ้ามี Peer Port ระบุ ให้เชื่อมต่อไปยัง Peer และดึง Blockchain ของเพื่อน
    if (peerPort) {
      const client = new net.Socket();
      client.connect(peerPort, "127.0.0.1", () => {
        console.log(
          `Node on port ${port}: Connected to peer on port ${peerPort}`
        );
        client.write(JSON.stringify(blockchain.chain)); // ส่ง Blockchain ของตัวเองไปยัง peer
        client.end();
      });
      peers.push(`127.0.0.1:${peerPort}`);
    }
  });
}

// การอ่านข้อมูลจาก command line เพื่อส่งไปยัง peers
function inputLoop(port: number) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    blockchain.addBlock(
      new Block(blockchain.chain.length, new Date().toISOString(), input)
    );
    console.log(`Node on port ${port}: Added block with data: ${input}`);
    broadcastBlockchain(); // ส่งข้อมูล blockchain ไปยัง peers หลังจากเพิ่มบล็อกใหม่
  });
}

// รัน Node ด้วยการระบุพอร์ต และพอร์ตของเพื่อนถ้ามี
const port = parseInt(process.argv[2]);
const peerPort = process.argv[3] ? parseInt(process.argv[3]) : undefined;

createNode(port, peerPort);
inputLoop(port);
