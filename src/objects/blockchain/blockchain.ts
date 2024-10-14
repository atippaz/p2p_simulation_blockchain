import { Block } from "./block";
import { Transaction } from "./transection";
export class Blockchain {
    chain: Block[];
    pendingTransactions: Transaction[];

    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
    }
    syncChain(receivedChain: any[]) {
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
        return new Block(0, new Date().toISOString(), [], "0");
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
        return !this.chain.some((x) =>
            x.data.some((s) => s.personalId == transaction.personalId)
        );
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