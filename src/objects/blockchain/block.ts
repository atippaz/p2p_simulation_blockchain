import * as crypto from "crypto";
import { Transaction } from "./transection";
export class Block {
    index: number;
    timestamp: string;
    data: any[];
    previousHash: string;
    hash: string;

    constructor(
        index: number,
        timestamp: string,
        data: Transaction[],
        previousHash: string = ""
    ) {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash(): string {
        return crypto
            .createHash("sha256")
            .update(
                this.index +
                this.previousHash +
                this.timestamp +
                JSON.stringify(this.data)
            )
            .digest("hex");
    }
}