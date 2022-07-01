const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hswxz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  await client.connect();
  console.log("connected to MongoDB");
  const tasksCollection = client.db("craveTasks").collection("tasks");
  const usersCollection = client.db("craveTasks").collection("users");
}




app.get("/", (req, res) => {
  res.send("Crave Tasks is Calling You!");
});

app.listen(port, () => {
  console.log(`listening to the port: ${port}`);
});