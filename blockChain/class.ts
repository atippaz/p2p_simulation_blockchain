import * as crypto from 'crypto';
import { AddressIp } from './interface';
import * as net from "net";

export class Transaction {
    voter: string;
    candidate: string;
    voteDate: Date;
    personalId: string;
    constructor(candidate: string, voteDate: Date, personalId: string, voter: string) {
        this.candidate = candidate
        this.voteDate = voteDate
        this.personalId = personalId
        this.voter = voter
    }
}

export class Block {
    index: number;
    timestamp: string;
    data: Transaction[];
    previousHash: string;
    hash: string;

    constructor(index: number, timestamp: string, data: Transaction[], previousHash: string = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash(): string {
        return crypto
            .createHash('sha256')
            .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data))
            .digest('hex');
    }
}

export class Blockchain {
    chain: Block[];
    pendingTransactions: Transaction[];

    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
    }
    syncChain(receivedChain: Block[]) {
        if (receivedChain.length > this.chain.length) {
            console.log("Blockchain updated from peer!");
            this.chain = receivedChain;
        } else {
            console.log("Received chain is not longer, no update performed.");
        }
    }
    addBlock(newBlock: Block) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
    }
    getBlockCount(): number {
        return this.chain.length;
    }
    createGenesisBlock(): Block {
        return new Block(0, new Date().toISOString(), [], '0');
    }

    getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    createTransaction(transaction: Transaction[]): void {
        this.pendingTransactions.push(...transaction);
    }

    async minePendingTransactions(): Promise<void> {
        const block = new Block(
            this.chain.length,
            new Date().toISOString(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        block.hash = block.calculateHash();
        this.chain.push(block);
        this.pendingTransactions = [];
    }
    isCanAddThisTransection(transaction: Transaction) {
        return !this.chain.some(x => x.data.some(s => s.personalId == transaction.personalId))
    }
    isChainValid(): boolean {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log(`Block ${i} has been tampered with!`);
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log(`Block ${i - 1}'s hash has been changed!`);
                return false;
            }
        }
        return true;
    }
}
export class PersonalProfile {
    private address: AddressIp
    private nodeId: string
    private listPeerips: AddressIp[]
    private socket: net.Socket
    private blockchain: Blockchain
    constructor(
        socket: net.Socket,
        address?: AddressIp,
        nodeId?: string | null,
        listPeerips?: AddressIp[],
    ) {
        this.listPeerips = listPeerips || []
        this.nodeId = nodeId || ''
        this.address = address || {}
        this.socket = socket
        this.blockchain = new Blockchain()
    }
    getSocket() {
        return this.socket
    }
    getBlockchain() {
        return this.blockchain
    }
    getAddress() {
        return this.address
    }
    getNodeId() {
        return this.nodeId
    }
    getListPeerIps() {
        return this.listPeerips
    }
    setAddress({ port, ip }: AddressIp) {
        port && (this.address!.port = port)
        ip && (this.address!.ip = ip)
    }
    setNodeId(nodeId: string) {
        this.nodeId = nodeId
    }
    setListPeerIps(addresses: AddressIp[]) {
        this.listPeerips = addresses
    }

}
