import { Blockchain } from "./class";
import * as net from "net";
import {
  AddressIp,
  COMMUICATE,
  CommunicateMessage,
} from "./interface";
import {
  setupConnectToOtherNode,
  setupManageIncomingConnection,
} from "./p2pController";

export class Context {
  port: number;
  peerList: AddressIp[];
  nodeId: string;
  ip: string;

  constructor(port: number, peerList: AddressIp[], nodeId: string, ip: string) {
    this.port = port;
    this.peerList = peerList;
    this.nodeId = nodeId;
    this.ip = ip;
  }
}

export class CreateNode {
  private server: net.Server;
  private blockChain: Blockchain;
  private context: Context | null = null;

  constructor() {
    this.blockChain = new Blockchain();
    this.server = net.createServer((socket) => {
      setupManageIncomingConnection({
        blockchain: this.blockChain,
        socket: socket,
        context: this.context!,
      });
    });
  }

  start(port: number, peerIp?: string) {
    this.server.listen(port, () => {
      console.log('Listening node at:', port);
      this.context = new Context(port, [], "", "");

      if (peerIp) {
        this.connectToPeer(peerIp);
      }
    });

    setInterval(() => {
      console.log(
        "I am on port ",
        this.context!.port,
        " and I have peer list: ",
        this.context!.peerList
      );
    }, 10000);

    return this.server;
  }

  private connectToPeer(peerIp: string) {
    const [peerAddress, peerPort] = peerIp.split(":");
    this.context!.peerList.push({ ip: peerAddress, port: +peerPort, nodeId: "" });
    setupConnectToOtherNode(this.context!);
  }

  getPeerList() {
    return this.context!.peerList;
  }

  getChainData() {
    return this.blockChain;
  }


  async terminate(): Promise<void> {
    if (!this.context?.peerList.length) {
      console.error('No peers available to terminate.');
      return;
    }

    const peer = this.context.peerList[0];
    console.log('Goodbye everyone', peer.port, peer.ip);

    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(peer.port!, peer.ip!, () => {
        client.write(JSON.stringify({
          type: COMMUICATE.TERMINATE_REQUEST,
          data: {
            ip: this.context?.ip,
            nodeId: this.context?.nodeId,
            port: this.context?.port,
          } as AddressIp
        } as CommunicateMessage));

        client.end();
        this.server.close()
        resolve();
      });

      client.on('error', (err: Error) => {
        console.error('Error in termination request:', err);
        reject(err);
      });
    });
  }
}
