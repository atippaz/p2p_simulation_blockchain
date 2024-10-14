export class Transaction {
    voter: string;
    candidate: string;
    voteDate: Date;
    personalId: string;
    constructor(
        candidate: string,
        voteDate: Date,
        personalId: string,
        voter: string
    ) {
        this.candidate = candidate;
        this.voteDate = voteDate;
        this.personalId = personalId;
        this.voter = voter;
    }
}