import { BlockChainSystem } from "../blockChain";
export interface smartContractInsertRequest {
    candidate: string
    personalId: string
    voteDate: Date
    voter: string
}
export function SmartContract() {
    const blockchain = BlockChainSystem()
    return {
        async addData(req: smartContractInsertRequest[]) {
            const exitItem = await blockchain.queryTransactions({ personalId: req.map(x => x.personalId) })
            await blockchain.addNewBlock(req.filter(t => !exitItem.some(s => s.personalId == t.personalId)).map(x => ({
                candidate: x.candidate,
                personalId: x.personalId,
                voteDate: x.voteDate,
                voter: x.voter
            })))
        },
        async getByPersonal(personalId: string) {
            const exitItem = await blockchain.queryTransactions({ personalId: [personalId] })
            return exitItem
        },
        async getAll() {
            const exitItem = await blockchain.getAllChain()
            return exitItem
        }
    }
}