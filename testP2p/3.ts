import * as net from 'net';

const blockchain = new Blockchain();
const port = 6001;
let peers: string[] = ['127.0.0.1:6000'];  // เชื่อมต่อกับ Node 1

function broadcastToPeers(message: string) {
    peers.forEach((peer) => {
        const [peerIp, peerPort] = peer.split(':');
        const client = new net.Socket();
        client.connect(Number(peerPort), peerIp, () => {
            client.write(message);
            client.end();
        });
    });
}

const server = net.createServer((socket) => {
    console.log('Node 2: New connection established');

    socket.on('data', (data) => {
        const message = data.toString();
        console.log(`Node 2: Received message: ${message}`);
        blockchain.addBlock(new Block(blockchain.chain.length, new Date().toISOString(), message));
        broadcastToPeers(message);
    });

    socket.on('end', () => {
        console.log('Node 2: Connection closed');
    });
});

server.listen(port, () => {
    console.log(`Node 2: Listening on port ${port}`);

    // เชื่อมต่อไปยัง Node 1
    const client = new net.Socket();
    client.connect(6000, '127.0.0.1', () => {
        client.write('Hello from Node 2');
        client.end();
    });
});
