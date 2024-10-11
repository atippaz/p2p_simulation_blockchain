import { Blockchain } from "../../blockchain/blockchain";
import { Context } from "../../node";
import { CommunicateMessage } from "../interface";

export function setupManageResponseConnection({
    blockchain,
    context,
}: {
    blockchain: Blockchain;
    context: Context;
}) {
    context.socket!.on("data", async (data) => {
        const response: CommunicateMessage = JSON.parse(data.toString());

        // try {
        //     await handleMessage(response, context, blockchain);
        // } catch (error) {
        //     blockchain.addBlock(new Block(blockchain.chain.length, new Date().toISOString(), []));
        // }
    });

    // context.socket!.on("end", () => {
    //     console.log(`Node on port ${context.socket!.localPort}: Connection closed`);
    // });
    // context.socket!.on("error", (error: any) => {
    //     handleRequestPeerList(context)
    //     console.warn("Connection was reset by the sender.");
    // });
}