import { AddressInfo } from "net";
import { createNode } from "../blockChain";
import { findAvailablePort } from './generateUniquePort'
// todo random port 
async function main() {
  const seedNode = new createNode()
  const initBlock = seedNode.start(6000);
  const peer1Ip = initBlock!.address() as AddressInfo
  const portIpSeedNode = (peer1Ip.address == '::' ? '127.0.0.1:' : peer1Ip.address) + peer1Ip.port
  new createNode().start(await findAvailablePort(), portIpSeedNode);
  new createNode().start(await findAvailablePort(), portIpSeedNode);
  new createNode().start(await findAvailablePort(), portIpSeedNode);
  new createNode().start(await findAvailablePort(), portIpSeedNode);
  new createNode().start(await findAvailablePort(), portIpSeedNode);
  setInterval(() => {
    console.log(seedNode.getPeerList())
  }, 1000)
}
main();
