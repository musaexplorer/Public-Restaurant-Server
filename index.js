const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jv3edzu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const userCollection = client.db('PublicRestaurantDB').collection('user');
        const TopFoodsCollection = client.db('PublicRestaurantDB').collection('topfoods');
        const AllItem = client.db('PublicRestaurantDB').collection('item');
        const OrderedNow = client.db('PublicRestaurantDB').collection('ordered');
        const CommingEvents = client.db('PublicRestaurantDB').collection('events');
        const BookNowEvents = client.db('PublicRestaurantDB').collection('booknow');

        app.get('/booknow', async (req, res) => {
            const cursor = BookNowEvents.find();
            const values = await cursor.toArray();
            res.send(values);
        });

        app.post('/booknow', async (req, res) => {
            try {
                const body = req.body;
                const result = await BookNowEvents.insertOne(body);
                res.status(201).send(result); // Send a 201 status for successful creation
            } catch (error) {
                console.error('Failed to insert document:', error);
                res.status(500).send({ message: 'Failed to add to booknow', error });
            }
        });

        app.delete('/booknow/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await BookNowEvents.deleteOne(query);
            res.send(result);
        });

        app.get('/events', async (req, res) => {
            const result = await CommingEvents.find().toArray();
            res.send(result);
        });

        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await CommingEvents.findOne(query);
            res.send(result);
        });

        app.get('/ordered', async (req, res) => {
            const cursor = OrderedNow.find();
            const values = await cursor.toArray();
            res.send(values);
        });

        app.post('/ordered', async (req, res) => {
            try {
                const body = req.body;
                const result = await OrderedNow.insertOne(body);
                res.status(201).send(result); // Send a 201 status for successful creation
            } catch (error) {
                console.error('Failed to insert document:', error);
                res.status(500).send({ message: 'Failed to add to ordered', error });
            }
        });

        app.delete('/ordered/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await OrderedNow.deleteOne(query);
            res.send(result);
        });

        app.get('/item', async (req, res) => {
            const result = await AllItem.find().toArray();
            res.send(result);
        });

        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AllItem.findOne(query);
            res.send(result);
        });

        app.get('/item', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
      
            console.log('pagination query', page, size);
            const result = await AllItem.find()
            .skip(page * size)
            .limit(size)
            .toArray();
            res.send(result);
        });

        app.post('/item', async(req, res)=>{
            const AddFoods = req.body;
            console.log(AddFoods);
            const result = await AllItem.insertOne(AddFoods);
            res.send(result);
        });

        app.put('/item/:id', async(req, res)=>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const options = {upsert: true};
            const UpdatedFoods = req.body;
            const foods = {
                $set: {
                    food_name:UpdatedFoods?.food_name, 
                    category:UpdatedFoods?.category, 
                    price:UpdatedFoods?.price, 
                    madeby:UpdatedFoods?.madeby, 
                    food_image:UpdatedFoods?.food_image, 
                    food_origin:UpdatedFoods?.food_origin, 
                    short_description:UpdatedFoods?.short_description, 
                }
            }
      
            const result = await AllItem.updateOne(filter, foods, options);
            res.send(result);
        })

        app.get('/topfoods', async (req, res) => {
            const result = await TopFoodsCollection.find().toArray();
            res.send(result);
        });

        app.get('/topfoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await TopFoodsCollection.findOne(query);
            res.send(result);
        });

        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        });


        app.post("/search", async (req, res) => {
            const { page, size, tagsList } = req.body;
        
            console.log(req.body); // For debugging purposes
            if (!page || !size) {
                return res.status(400).send({ message: 'Page and size are required' });
            }
        
            try {
                if (!tagsList || tagsList.length === 0) {
                    const find = await AllItem.find({ Status: "Accepted" })
                        .skip(page * size)
                        .limit(size)
                        .toArray();
                    return res.send(find);
                }
        
                const arrayData = tagsList.map((item) => item.text);
                const result = await AllItem.aggregate([
                    {
                        $match: {
                            Tags: { $in: arrayData },
                            Status: "Accepted",
                        },
                    },
                ]).toArray();
        
                res.send(result);
            } catch (error) {
                console.error('Error handling /search:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        });
        

        app.get("/itemlength", async (req, res) => {
            try {
                const result = await AllItem.estimatedDocumentCount();
                console.log("Total Items:", result);
                return res.status(200).send({ result });
            } catch (error) {
                console.error("Error fetching item count:", error);
                return res.status(500).send({ error: "Server error fetching item count." });
            }
        });
        


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.use('/', (req, res) => {
    res.send('Public Restaurant Sever is running')
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});