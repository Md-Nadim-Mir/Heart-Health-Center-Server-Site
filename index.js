const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const port = process.env.PORT || 3000
const stripe =require('stripe')(process.env.PAYMENT_SECRET_KEY)

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  console.log(token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

const client = new MongoClient(process.env.DB_uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {


  try {


    // Send a ping to confirm a successful connection
    
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )


    //  collection create 
    const testCollection = client.db('Health_DB').collection('All_Tests');
    const usersCollection = client.db('Health_DB').collection('users');
    const doctorsCollection = client.db('Health_DB').collection('Doctors');
    const blogsCollection = client.db('Health_DB').collection('Blogs');
    const appointCollection = client.db('Health_DB').collection('Appoints');



    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      console.log('I need a new jwt', user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })

    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
        console.log('Logout successful')
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // get user form database
    app.get('/users', async (req, res) => {

      const result = await usersCollection.find().toArray();
      res.send(result)
    })



    // get user from email
    app.get('/users/:email', async (req, res) => {

      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    })



    // Save or modify user email, status in DB
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email: email }
      const options = { upsert: true }
      const isExist = await usersCollection.findOne(query)
      console.log('User found?----->', isExist)
      if (isExist) return res.send(isExist)
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      )
      res.send(result)
    })


    // user delete from database
    app.delete('/users/:email', async (req, res) => {

      const email = req.params.email;
      const query = { email: email }

      const result = await usersCollection.deleteOne(query);
      res.send(result);

    })







    // all tests collections

    app.get('/all_tests', async (req, res) => {

      const result = await testCollection.find().toArray();
      res.send(result);
    })

    app.get('/all_tests/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await testCollection.findOne(query);
      res.send(result);
    })


    // [post method]

    app.post('/all_tests', async (req, res) => {

      const newTest = req.body;
      console.log(newTest);

      const result = await testCollection.insertOne(newTest);
      res.send(result);

    })

    //  delete
    app.delete('/all_tests/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const result = await testCollection.deleteOne(query);
      res.send(result);

    })



    // doctor api get , post , delete 

    app.get('/doctors', async (req, res) => {

      const result = await doctorsCollection.find().toArray();
      res.send(result);
    })


    // doctors one 

    app.get('/doctors/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await doctorsCollection.findOne(query);
      res.send(result);
    })

    //  doctor post 

    app.post('/doctors', async (req, res) => {

      const query = req.body;
      console.log(query)
      const result = await doctorsCollection.insertOne(query);
      res.send(result);
    })

    app.delete('/doctors/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await doctorsCollection.deleteOne(query);
      res.send(result)
    })



    // doctor api get , post , delete 


    // blogs api get , post , delete 

    app.get('/blogs', async (req, res) => {

      const result = await blogsCollection.find().toArray();
      res.send(result);
    })


    // blogs api get , post , delete 

    app.get('/blogs/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await blogsCollection.findOne(query);
      res.send(result);
    })

    //  doctor post 

    app.post('/blogs', async (req, res) => {

      const query = req.body;
      console.log(query)
      const result = await blogsCollection.insertOne(query);
      res.send(result);
    })

    app.delete('/blogs/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await blogsCollection.deleteOne(query);
      res.send(result)
    })



    // blogs api get , post , delete 


    //  generate payment system
    app.post('/create-payment-intent',async(req,res)=>{

         const {price} =req.body;
         const amount =parseInt(price*100);
         
         if(!price|| amount < 1)  return;

         const {client_secret}= await stripe.paymentIntents.create ({

             amount : amount,
             currency : 'usd',
             payment_method_types:['card']
         })


         res.send({clientSecret : client_secret})

    })


    //  booking info

    app.get('/appoint', async(req,res)=>{

      const result = await appointCollection.find().toArray();
     // ... send email
      res.send(result)
         
    })


    app.get('/appoint/:email', async(req,res)=>{

      const email =req.params.email;
      const query = {user_email : email}
      const result = await appointCollection.find(query).toArray();
     // ... send email
      res.send(result)
         
   })

  

    app.post('/appoint',async(req,res)=>{

       const appoint =req.body;
       const result = await appointCollection.insertOne(appoint);
      // ... send email
       res.send(result)
          
    })

    
    // delete
    app.delete('/appoints/:id', async(req,res)=>{

      const id =req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await appointCollection.deleteOne(query);
      res.send(result)
         
   })

    //  update

    // app.patch('/appoint/status/:id',async(req,res)=>{

    //   const id = req.params.id;
    //   const status = req.body.status;
    //   const query = { _id: new ObjectId(id)}
    //   const updateDoc = {

    //       $set: {

    //            appoint : status
    //       }
          
    //   }

    //   const result = await appointCollection.updateOne(query,updateDoc);
    //   res.send(result);


    // })


  } finally {

  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from Heart Health Center Server..')
})

app.listen(port, () => {
  console.log(`Heart Health Center is running on port ${port}`)
})
