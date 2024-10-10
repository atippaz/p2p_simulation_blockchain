const net = require('net');

const commonPorts = [80, 443, 3000, 5000, 5432, 3306, 27017];

function getRandomPort() {
    let port;
    do {
        port = Math.floor(Math.random() * (65535 - 1024) + 1024);
    } while (commonPorts.includes(port));
    return port;
}

async function checkPortAvailability(port: number, host: string): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, host, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        server.on('error', () => resolve(false));
    });
}

export async function findAvailablePort(host = '127.0.0.1') {
    let port: number | null;
    let isAvailable = false;

    while (!isAvailable) {
        port = getRandomPort();
        isAvailable = await checkPortAvailability(port!, host);
    }

    return port! as number;
}

