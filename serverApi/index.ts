import express from 'express';
import { SmartContract, type smartContractInsertRequest } from '../smartContract';

const app = express();
const port = 3000;
const smartContact = SmartContract()
const transection: smartContractInsertRequest[] = []
app.use(express.json());
app.post('/votes/:userId', async (req, res) => {
    const { personalId, voter } = req.body;
    const { userId } = req.params;
    try {
        transection.push({
            candidate: userId,
            personalId: personalId,
            voteDate: new Date(),
            voter: voter
        })
        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, error: error });
    }
    finally {
        if (transection.length >= 10) {
            smartContact.addData(transection)
        }
    }
});
app.get('/blockchain', async (req, res) => {
    const data = await smartContact.getAll()
    res.status(200).send({ success: true, data: data });
})
app.get('/votes/personal/:personalId', async (req, res) => {
    const { personalId } = req.params;
    try {
        const data = await smartContact.getByPersonal(personalId)
        res.send({ success: true, data: data });
    } catch (error) {
        res.status(500).send({ success: false, error: error });
    }
});
app.listen(port, () => {
    console.log(`API server is running on http://localhost:${port}`);
});
