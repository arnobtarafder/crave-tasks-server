const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

app.use(cors());
app.use(express.json());



function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hswxz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const tasksCollection = client.db("craveTasks").collection("tasks");
    const usersCollection = client.db("craveTasks").collection("users");


    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden" });
      }
    };

    app.get("/tasks", verifyJWT, async (req, res) => {
      const tasks = await tasksCollection.find({}).toArray();
      res.send(tasks);
    });

    app.get("/users", async (req, res) => {
      const uid = req.query.uid;
      if (uid) {
        const users = await usersCollection.find({ uid: uid }).toArray();
        res.send(users);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    app.get("/users/all", verifyJWT, async (req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });

    // UPDATE USER DATA USING PATCH
    app.patch("/users", verifyJWT, async (req, res) => {
      const data = req.body;
      const uid = req.query.uid;
      const decodedID = req.decoded.uid;
      const query = { uid: uid };
      const updateDoc = {
        $set: data,
      };
      if (decodedID === uid) {
        const result = await usersCollection.updateOne(query, updateDoc);
        if (result.acknowledged) {
          res.send({ success: true, message: "Updated profile successfully" });
        }
      } else {
        res.status(403).send({ success: false, message: "Forbidden request" });
      }
    });

    app.put("/user", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email, uid: user.uid };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: user.email, uid: user.uid },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      res.send({ result, token });
    });

    app.delete("/user/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.deleteOne({ email: email });
      res.send(result);
    });


    // TASK POST
    app.post("/createTask", verifyJWT, async (req, res) => {
      const data = req.body;
      const decodedId = req.decoded.uid;
      const uid = req.query.uid;
      if (uid === decodedId) {
        const result = await tasksCollection.insertOne(data);
        if (result.acknowledged) {
          res.send({
            success: true,
            message: "Task Added successfully",
          });
        }
      } else {
        res.status(403).send({ success: false, message: "Forbidden Access." });
      }
    });

    // TASK DELETE
    app.delete("/task", verifyJWT, async (req, res) => {
      const todoId = req.query.todoId;
      const decodedId = req.decoded.uid;
      const uid = req.query.uid;
      if (decodedId === uid) {
        const result = await tasksCollection.deleteOne({
          _id: ObjectId(todoId),
        });
        if (result.acknowledged) {
          res.send({
            success: true,
            message: "Task Deleted successfully",
          });
        }
      } else {
        res.status(403).send({ success: false, message: "Forbidden Access." });
      }
    });

    app.patch("/task", verifyJWT, async (req, res) => {
      const decodedId = req.decoded.uid;
      const uid = req.query.uid;
      const todoId = req.query.todoId;
      if (decodedId === uid) {
        const query = { _id: ObjectId(todoId) };
        const updateDoc = {
          $set: { completed: true },
        };
        const result = await tasksCollection.updateOne(query, updateDoc);
        if (result.acknowledged) {
          res.send({ success: true, message: "ToDo Completed" });
        }
      } else {
        res.status(403).send({ success: false, message: "Forbidden Access." });
      }
    });

    app.get("/myTasks", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const myItems = await tasksCollection.find({ email: email }).toArray();
        res.send(myItems);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get("/myTasks/completed", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const myItems = await tasksCollection
          .find({ email: email, completed: true })
          .toArray();
        res.send(myItems);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    app.patch("/task/updateTask/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: body,
      };
      const taskUpdating = await tasksCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(taskUpdating);
    });

  } 

  
  finally {
  
  }
}


run().catch(console.dir);





app.get("/", (req, res) => {
  res.send("Crave Tasks is Calling You!");
});

app.listen(port, () => {
  console.log(`listening to the port: ${port}`);
});