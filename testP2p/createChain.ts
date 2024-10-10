import { AddressInfo } from "net";
import { createNode } from "../blockChain";
import { findAvailablePort } from './generateUniquePort'
// todo random port 
async function main() {
  const seedNode = new createNode()
  const initBlock = seedNode.start(6000);
  const peer1Ip = initBlock!.address() as AddressInfo
  const portIpSeedNode = (peer1Ip.address == '::' ? '127.0.0.1:' : peer1Ip.address) + peer1Ip.port
  const block1 = new createNode().start(await findAvailablePort(), portIpSeedNode);
  const block2 = new createNode().start(await findAvailablePort(), portIpSeedNode);
  const block3 = new createNode().start(await findAvailablePort(), portIpSeedNode);
  const block4 = new createNode().start(await findAvailablePort(), portIpSeedNode);
  const block5 = new createNode().start(await findAvailablePort(), portIpSeedNode);
  setInterval(() => {
    console.log(seedNode.getPeerList())
  }, 1000)
}
main();
