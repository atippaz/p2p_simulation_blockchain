import * as crypto from 'crypto';
class Transaction {
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

export interface newBlockRequest {
    voter: string;
    candidate: string;
    voteDate: Date;
    personalId: string;
}
export function BlockChainSystem() {
    const myBlockchain = new Blockchain();
    return {
        async addNewBlock(req: newBlockRequest[]) {
            const transections: Transaction[] = []
            req.forEach((request) => {
                const newTransection = new Transaction(
                    request.candidate,
                    request.voteDate,
                    request.personalId,
                    request.voter,
                )
                if (myBlockchain.isCanAddThisTransection(newTransection)) {
                    transections.push(newTransection)
                }
                else {
                    throw new Error('Blockchain is invalid! Transaction aborted.');
                }
            })
            if (myBlockchain.isChainValid()) {
                myBlockchain.createTransaction(transections)
                await myBlockchain.minePendingTransactions()
            }
            else {
                throw new Error('Blockchain is invalid! Transaction aborted.');
            }
        },
        async queryTransactions(query?: { [key in keyof Transaction]?: string[] }): Promise<Transaction[]> {
            const result: Transaction[] = [];
            myBlockchain.chain.forEach(block => {
                block.data.forEach(transaction => {
                    let match = true;
                    for (const key in query) {
                        if (query[key as keyof Transaction]?.some(s => s !== transaction[key as keyof Transaction])) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        result.push(transaction);
                    }
                });
            });
            return result;
        },
        getAllChain() {
            return myBlockchain.chain
        }
    }
}