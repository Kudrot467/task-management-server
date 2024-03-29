const express = require('express');
const cors = require('cors');
const app=express();
const jwt=require('jsonwebtoken')
require('dotenv').config()
const port=process.env.PORT||5000;

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.clkkquk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
   const usersCollection= client.db('tasksDB').collection('users');
   const tasksCollection= client.db('tasksDB').collection('tasks');


   app.post('/jwt',async(req,res)=>{
    const user=req.body;
    const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
      expiresIn:'1h'
    });
    res.send({ token });
  })

  const verifyToken=(req,res,next)=>{
    console.log('inside',req.headers)
    if(!req.headers.authorization){
      return res.status(401).send({message:'unauthorized'})
    }
    const token=req.headers.authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.status(401).send({message:'unauthorized'})
      }
      req.decoded=decoded;
      next();
    })
  }


   app.delete('/tasks/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id : new ObjectId(id)}
        const result=await tasksCollection.deleteOne(query);
        res.send(result)
    })

  app.get('/tasks',async(req,res)=>{
    let query={};
    if(req.query?.email){
        query={email: req.query.email}
    }
    const cursor=tasksCollection.find(query);
    const result=await cursor.toArray();
    res.send(result);

})

app.post('/tasks',async(req,res)=>{
    const post=req.body;
    const result=await tasksCollection.insertOne(post);
    res.send(result);
})


   app.get('/users',async(req,res)=>{
     
    let query={};
    if(req.query?.email){
        query={email: req.query.email}
    }
    const cursor=usersCollection.find(query);
    const result=await cursor.toArray();
    res.send(result);
});

app.post('/users', async (req, res) => {
    const user = req.body;
    const query={email: user.email}
    const existingUser=await usersCollection.findOne(query);
    if(existingUser)
    {
        res.send({message:'user already exists', insertedId:null})
    }
    const result = await usersCollection.insertOne(user);
   console.log(result);
    res.send(result);
})

    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    //console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('task server is running')
})

app.listen(port,()=>{
    console.log(`Task server is running on ${port}`)
})