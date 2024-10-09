import * as net from 'net';

const blockchain = new Blockchain();
const port = 6000;
let peers: string[] = [];  // เก็บเพื่อน (node) ที่เชื่อมต่อกัน

// ฟังก์ชันส่งข้อมูลไปยัง peers
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

// สร้าง Server ฟังที่พอร์ต 6000
const server = net.createServer((socket) => {
    console.log('Node 1: New connection established');

    socket.on('data', (data) => {
        const message = data.toString();
        console.log(`Node 1: Received message: ${message}`);
        blockchain.addBlock(new Block(blockchain.chain.length, new Date().toISOString(), message));
        broadcastToPeers(message);  // ส่งต่อไปยัง peers อื่นๆ
    });

    socket.on('end', () => {
        console.log('Node 1: Connection closed');
    });
});

// เริ่มฟังที่พอร์ต 6000
server.listen(port, () => {
    console.log(`Node 1: Listening on port ${port}`);
});
