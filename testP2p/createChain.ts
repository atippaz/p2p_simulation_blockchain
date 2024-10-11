import { AddressInfo } from "net";
import { CreateNode } from "../blockChain";
import { exec } from 'node:child_process';
async function main() {
  const seedNode = new CreateNode();
  const initBlock = seedNode.start(6000);
  const peer1Ip = initBlock!.address() as AddressInfo;
  const portIpSeedNode =
    (peer1Ip.address == "::" ? "127.0.0.1:" : peer1Ip.address) + peer1Ip.port;

  const spawnNode = +process.argv[2] || 1
  for (let index = 0; index < spawnNode; index++) {
    setTimeout(() => {
      exec(`start cmd.exe /k npx ts-node testP2p/spawnNode.ts ${portIpSeedNode}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error:', error);
          return;
        }
      });
    }, 1000);
  }
}
main();
