import * as net from "net";

import { AddressConnection } from "./addressConnection";
import { Blockchain } from "../blockchain/blockchain";
import { AddressIp, COMMUICATE, CommunicateMessage } from "./interface";
import { setupManageIncomingConnection } from "./p2pController/request";

export class Context {
  // port: number;
  peerList: AddressIp[];
  nodeId: string | null = null;
  connection: AddressConnection[] = []
  socket: net.Socket | null = null
  // ip: string;

  constructor(peerList: AddressConnection[]) {
    // this.port = port;
    this.peerList = peerList;
    // this.ip = ip;
  }
}

export class CreateNode {
  private server: net.Server;
  private blockChain: Blockchain;
  private context: Context | null = null;

  constructor() {
    this.blockChain = new Blockchain();
    this.server = net.createServer((socket) => {
      if (!this.context) {
        throw Error('no context')
      }
      console.log('init incoming')
      this.context.socket = socket
      setupManageIncomingConnection({
        blockchain: this.blockChain,
        context: this.context!,
      });
    });
  }

  start(port: number, peerIp?: string) {

    this.context = new Context([]);
    this.server.listen(port, () => {
      const addressInfo = this.server.address();
      if (typeof addressInfo === 'object' && addressInfo !== null) {
        console.log(`Server listening on IP: ${addressInfo.address}, Port: ${addressInfo.port}`);
        if (peerIp) {
          this.connectToPeer(peerIp, addressInfo, this.context!);
        }
      }
    });
    return this.server;
  }

  private connectToPeer(peerIp: string, server: net.AddressInfo, context: Context) {
    const [peerAddress, peerPort] = peerIp.split(":");
    const client = new net.Socket();
    context.connection.push(new AddressConnection(client, +peerPort, peerAddress, true))
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
            ip: this.context?.socket!.localAddress,
            nodeId: this.context?.nodeId,
            port: this.context?.socket!.localPort,
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
