import { AddressInfo } from "net";
import { createNode } from "../blockChain";

function main() {
  const server1 = new createNode().start(6000);
  const peer1Ip = server1!.address() as AddressInfo
  const server2 = new createNode().start(6001, (peer1Ip.address == '::' ? '127.0.0.1:' : peer1Ip.address) + peer1Ip.port);
  // const server3 = createNode(6002);
  // server3.start();
}
main();
