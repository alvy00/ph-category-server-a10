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

        app.get("/bills", async (req, res) => {
            const bills = await billsColl.find().toArray();
            //console.log(bills);
            res.send(bills);
        });

        app.get("/bill/:id", async (req, res) => {
            const { id } = req.params;

            const result = await billsColl.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.post("/addbill", async (req, res) => {
            const bill = req.body;
            const insertion = billsColl.insertOne(bill);
            console.log(bill);

            res.send(bill);
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
