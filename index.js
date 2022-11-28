const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt =  require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json())
app.use(cors())


function verifyJWT (req, res, next){
    const authHeader = req.headers.authorization
    if(!authHeader){
        return res.status(401).send('UnAuthoriged Access')
    }

    const token = authHeader.split(' ')[1];
    // console.log(token, authHeader);

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            // console.log(err);
            return res.status(403).send({message: 'Forbidden Access'})
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p8qnexq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const allPhoneCatagories = client.db('bikeZone').collection('catagories')
        const usersCollection = client.db('bikeZone').collection('users')
        const bookingsCollection = client.db('bikeZone').collection('bookings')
        const productsCollection = client.db('bikeZone').collection('products')
        const wishlistsCollection = client.db('bikeZone').collection('wishlists')
        const AdvertisedCollection = client.db('bikeZone').collection('advertised')
        const allCollection = client.db('bikeZone').collection('all')


        app.get('/catagories', async(req, res) =>{
            const query = {};
            const result = await allPhoneCatagories.find(query).toArray();
            // console.log(query);
            res.send(result);
        })

        app.get('/catagories/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {catagory_id: id}
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/users', async(req, res) =>{
            const user = req.body;
            const inserted = await usersCollection.findOne({email: user.email})
            if(inserted){
                return res.send({message: 'Previously Added'})
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.get('/users', async(req, res) =>{
            const query = {}
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        app.delete('/users/admin/:id', async(req, res) =>{
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/users/admin/:id', async(req, res) =>{
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const options = {upsert: true}
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne( filter,  updateDoc, options)
            res.send(result);
        })

        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query)
            res.send({isAdmin: user?.role === 'admin'})
        })


        app.get('/users/seller/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query)
            res.send({isSeller: user?.role === 'seller' || user?.role === 'admin'})
        })

        app.post('/bookings', async(req, res) =>{
            const booking = req.body;
            const result= await bookingsCollection.insertOne(booking);
            res.send(result)    
        })

        app.get('/bookings', verifyJWT, async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/addProduct', verifyJWT, async(req, res) =>{
            const currentCatagory = await productsCollection.findOne({catagory_id: req.body.catagory_id})
            const newProducts = [...currentCatagory.collections, req.body]
            const updayedDoc = {
                $set: {
                    collections: newProducts
                }
            }
            const result = await productsCollection.updateOne({catagory_id: req.body.catagory_id}, updayedDoc)
            const allTime = req.body;
            const all = await allCollection.insertOne(allTime)
            res.send(result);
        })

        app.post('/wishlists', async(req, res) =>{
            const wishlists = req.body;
            const result= await wishlistsCollection.insertOne(wishlists);
            // res.send({acknowledge: true, message: `You booking is successful on ${booking.appointmentDate}`})
            res.send(result)    
        })

        app.get('/wishlists', async(req, res) =>{
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;

            // if(decodedEmail !== email){
            //     return res.status(403).send({message: 'Forbidden Access'})
            // }

            const query = {email: email};
            const bookings = await wishlistsCollection.find(query).toArray();
            res.send(bookings);
        })

        
        app.post('/advertised', async(req, res) =>{
            const advertised = req.body;
            const result= await AdvertisedCollection.insertOne(advertised);
            // res.send({acknowledge: true, message: `You booking is successful on ${booking.appointmentDate}`})
            res.send(result)    
        })

        app.get('/advertised', async(req, res) =>{
            const query = {};
            const bookings = await AdvertisedCollection.find(query).toArray();
            res.send(bookings);
        })


        app.get('/myproducts', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const myProduct = await allCollection.find(query).toArray();
            res.send(myProduct);
        })

        app.delete('/wishlist/:id', verifyJWT, async(req, res) =>{
            const id = req.params.id;
            const filter = {_id:  ObjectId(id)}
            const result = await wishlistsCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN) //, {expiresIn: '1h'}
                // console.log(token);
                return res.send({accessToken: token})
            }
            res.status(403).send({accessToken: ''})
        })

    }

    finally{

    }
}


run().catch(console.log)


app.get('/', (req, res) =>{
    res.send('Mobile Zone server is running')
})

app.listen(port, () =>{
    console.log(`Mobile Zone is running on ${port}`);
})