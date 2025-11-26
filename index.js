const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4200;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wsrxsq8.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello world!");
});

async function run() {
    try {
        await client.connect();

        const db = client.db("billsDB");
        const billsColl = db.collection("bills");
        const paidBillsColl = db.collection("paidbills");

        app.get("/bills", async (req, res) => {
            const bills = await billsColl.find().toArray();
            res.send(bills);
        });

        app.get("/getfiltered", async (req, res) => {
            // const electricity = await billsColl
            //     .find({ category: "electricity" })
            //     .toArray();
            // const water = await billsColl.find({ category: "water" }).toArray();
            // const gas = await billsColl.find({ category: "gas" }).toArray();
            // const internet = await billsColl
            //     .find({ category: "internet" })
            //     .toArray();
            const bills = await billsColl.find().toArray();
            const groupedBills = bills.reduce((acc, bill) => {
                const category = bill.category.toLowerCase();
                if (!acc[category]) {
                    acc[category] = [];
                }

                acc[category].push(bill);
                return acc;
            }, {});
            res.send(groupedBills);
        });

        app.get("/recentbills", async (req, res) => {
            const bills = await billsColl.find().limit(6).toArray();
            res.send(bills);
        });

        app.get("/bill/:id", async (req, res) => {
            const { id } = req.params;

            const result = await billsColl.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get("/mybills/:email", async (req, res) => {
            const { email } = req.params;
            const query = { email: email };

            const cursor = await billsColl.find(query);
            const data = await cursor.toArray();
            res.send(data);
        });

        app.get("/mypaidbills", async (req, res) => {
            const { email } = req.query;
            const data = await paidBillsColl.find({ email }).toArray();
            res.send(data);
        });

        app.post("/addbill", async (req, res) => {
            const bill = req.body;
            const insertion = billsColl.insertOne(bill);

            res.send(bill);
        });

        app.post("/paybill", async (req, res) => {
            const bill = req.body;
            const insertion = paidBillsColl.insertOne(bill);

            res.send(bill);
        });

        app.delete("/deletebill/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const delResult = await billsColl.deleteOne(query);

            res.send(delResult);
        });

        app.patch("/updatebill/:id", async (req, res) => {
            const { id } = req.params;
            const bill = req.body;
            const update = {
                $set: {
                    amount: bill.amount,
                    location: bill.location,
                    username: bill.username,
                    phone: bill.phone,
                    date: bill.updatedDate,
                },
            };
            const query = { _id: new ObjectId(id) };
            const options = {};

            const updateRes = await billsColl.updateOne(query, update, options);
            res.send(updateRes.upsertedCount);
        });

        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB pinged!");
    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
