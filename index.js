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
        res.status(403).send({ message: "forbidden" });
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
        res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get("/users/all", verifyJWT, async (req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });


    // UPDATE USER DATA USING PATCH //
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
          res.send({ success: true, message: "Update profile successfully" });
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


    // DELETE USER //
    app.delete("/user/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.deleteOne({ email: email });
      res.send(result);
    });

    // TASK POST //
    app.post("/createTask", verifyJWT, async (req, res) => {
      const data = req.body;
      const decodedId = req.decoded.uid;
      const uid = req.query.uid;
      if (uid === decodedId) {
        const result = await tasksCollection.insertOne(data);
        if (result.acknowledged) {
          res.send({
            success: true,
            message: "ToDos Added successfully",
          });
        }
      } else {
        res.status(403).send({ success: false, message: "Forbidden Access." });
      }
    });

      // TASK DELETE //
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
              message: "ToDo Deleted successfully",
            });
          }
        } else {
          res.status(403).send({ success: false, message: "Forbidden Access." });
        }
      });
    
      
      // CATCH COMPLETED TASK // 
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
            res.send({ success: true, message: "Task Completed" });
          }
        } else {
          res.status(403).send({ success: false, message: "Forbidden Access." });
        }
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