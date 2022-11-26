const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json())
app.use(cors())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p8qnexq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const allPhoneCatagories = client.db('bikeZone').collection('catagories')
        const usersCollection = client.db('bikeZone').collection('users')
        const bookingsCollection = client.db('bikeZone').collection('bookings')
        const productsCollection = client.db('bikeZone').collection('products')
        const wishlistsCollection = client.db('bikeZone').collection('wishlists')


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


        app.get('/users/bayer/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query)
            res.send({isSeller: user?.role === 'seller'})
        })

        app.post('/bookings', async(req, res) =>{
            const booking = req.body;
            // console.log(booking);

            // const query = {
            //     appointmentDate: booking.appointmentDate,
            //     email: booking.email,
            //     treatment: booking.treatment
            // }

            // const alreadyBooked = await bookingsCollection.find(query).toArray();
            // // console.log(alreadyBooked);
            // if(alreadyBooked.length >= 1){
            //     const message = `You already have a booking on ${booking.appointmentDate}`
            //     return res.send({acknowledge: false, message})
            // }

            const result= await bookingsCollection.insertOne(booking);
            
            // res.send({acknowledge: true, message: `You booking is successful on ${booking.appointmentDate}`})
            res.send(result)    
        })

        app.get('/bookings', async(req, res) =>{
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;

            // if(decodedEmail !== email){
            //     return res.status(403).send({message: 'Forbidden Access'})
            // }

            const query = {email: email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/addProduct', async(req, res) =>{
            const currentCatagory = await productsCollection.findOne({catagory_id: req.body.catagory_id})
            const newProducts = [...currentCatagory.collections, req.body]
            const updayedDoc = {
                $set: {
                    collections: newProducts
                }
            }
            const result = await productsCollection.updateOne({catagory_id: req.body.catagory_id}, updayedDoc)
            res.send(result);
        })

        app.post('/wishlists', async(req, res) =>{
            const wishlists = req.body;
            // const query = {
            //     appointmentDate: booking.appointmentDate,
            //     email: booking.email,
            //     treatment: booking.treatment
            // }
            // const alreadyBooked = await bookingsCollection.find(query).toArray();
            // // console.log(alreadyBooked);
            // if(alreadyBooked.length >= 1){
            //     const message = `You already have a booking on ${booking.appointmentDate}`
            //     return res.send({acknowledge: false, message})
            // }
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


        // app.get('/myproducts', async(req, res) =>{
        //     const email = req.query.email;
        //     // const decodedEmail = req.decoded.email;

        //     // if(decodedEmail !== email){
        //     //     return res.status(403).send({message: 'Forbidden Access'})
        //     // }

        //     const query = {email: email};
        //     const myProduct = await productsCollection.find(query).toArray();
        //     res.send(myProduct);
        // })

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