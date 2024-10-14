export function generateNodeId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

export function extractIpAddress(ip: string): string {
    const match = ip.match(/(?:\d{1,3}\.){3}\d{1,3}/);
    return match ? match[0] : ip;
}