import { initBlockToChain } from "./template";

function main() {
  const server1 = initBlockToChain(6000);
  server1.start();
  const server2 = initBlockToChain(6001);
  server2.start();
  const server3 = initBlockToChain(6002);
  server3.start();
}
main();
