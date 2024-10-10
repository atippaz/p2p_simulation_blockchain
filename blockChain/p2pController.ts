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
// function broadcastToPeers(message: string, excludePort?: number) {
//     peers.forEach((peer) => {
//       const [peerIp, peerPort] = peer.split(":");
//       if (Number(peerPort) !== excludePort) {
//         const client = new net.Socket();
//         client.connect(Number(peerPort), peerIp, () => {
//           client.write(message);
//           client.end();
//         });
//       }
//     });
//   }

//   function broadcastBlockchain() {
//     const chainData = JSON.stringify(blockchain.chain);
//     broadcastToPeers(chainData);
//   }

export function setupManageIncommingConnection({
  blockchain,
  socket,
  context,
}: {
  blockchain: Blockchain;
  socket: net.Socket;
  context: Context;
}) {
  socket.on("data", (data) => {
    console.log("i am port :", context.port);
    const response = JSON.parse(data.toString()) as CommunicateMessage;
    try {
      if (response.type === COMMUICATE.JOINCHAIN) {
        const nodeId =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        context.peerList.push({
          ip: response.data.ip,
          port: response.data.port,
          nodeId: nodeId,
        });
        const receivedChain = [response];
        blockchain.syncChain(receivedChain);
        context.peerList.push({
          ip: context.ip,
          port: context.port,
          nodeId: nodeId,
        });
        socket.write(
          JSON.stringify({
            data: {
              nodeId: nodeId,
            },
            type: COMMUICATE.ACCEPTTOJOIN,
          } as CommunicateMessage<AcceptJoin>)
        );
      } else if (response.type === COMMUICATE.REQUESTPEERLIST) {
        if (context.peerList.some((s) => s.nodeId == response.data.nodeId)) {
          socket.write(
            JSON.stringify({
              data: context.peerList,
              type: COMMUICATE.RESPONSEPEERLIST,
            })
          );
        }
      }
    } catch (error) {
      blockchain.addBlock(
        new Block(blockchain.chain.length, new Date().toISOString(), [])
      );
    }
    // socket.write();
    // broadcastBlockchain();
  });

  socket.on("end", () => {
    console.log(`Node on port ${context.port}: Connection closed`);
  });
}
export function setupConnectToOtherNode(context: Context) {
  const client = new net.Socket();

  client.connect(
    context.peerList[context.peerList.length - 1].port!,
    context.peerList[context.peerList.length - 1].ip!,
    () => {
      client.write(
        JSON.stringify({
          data: {
            ip: context.ip,
            port: context.port,
          },
          type: COMMUICATE.JOINCHAIN,
        } as CommunicateMessage<NewConnectionRequest>)
      );
      client.on("data", async (data) => {
        console.log(
          "i am port: ",
          context.port,
          " i recipt some response form ",
          data
        );
        const response = JSON.parse(data.toString()) as CommunicateMessage;
        if (response.type === COMMUICATE.ACCEPTTOJOIN) {
          console.log(response.data);
          context.nodeId = (response.data as AcceptJoin).nodeId;
          client.write(
            JSON.stringify({
              type: COMMUICATE.REQUESTPEERLIST,
              data: { nodeId: context.nodeId },
            })
          );
        } else if (response.type === COMMUICATE.RESPONSEPEERLIST) {
          console.log(response.data);
          context.peerList.slice(0, context.peerList.length - 1);
          context.peerList.push(...(response.data as AddressIp[]));
          const datas = await Promise.all([]);
        }
        client.end();
      });
    }
  );
}
