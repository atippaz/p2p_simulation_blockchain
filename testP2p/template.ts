import * as net from "net";
import { Block, Blockchain } from "../blockChain";
import { start } from "repl";

let peers: string[] = [];
export function initBlockToChain(port: number, nameServer: string = "") {
  const blockchain = new Blockchain();
  function broadcastToPeers(message: string) {
    peers.forEach((peer) => {
      const [peerIp, peerPort] = peer.split(":");
      const client = new net.Socket();
      client.connect(Number(peerPort), peerIp, () => {
        client.write(message);
        client.end();
      });
    });
  }

  // สร้าง Server ฟังที่พอร์ต 6000
  const server = net.createServer((socket) => {
    console.log("Node " + port + " : New connection established");

    socket.on("data", (data) => {
      const message = data.toString();
      console.log(message);
      //   console.log(`Node 1: Received message: ${message}`);
      //   blockchain.addBlock(
      //     new Block(blockchain.chain.length, new Date().toISOString(), message)
      //   );
      //   broadcastToPeers(message);
    });

    socket.on("end", () => {
      console.log("Node 1: Connection closed");
    });
  });

  return {
    start() {
      server.listen(port, () => {
        console.log(`Node 1: Listening on port ${port}`);
      });
    },
  };
}
