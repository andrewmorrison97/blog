import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

// app.get('/hello', (req, res) => res.send('Hello'));
// app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}!`));

// app.post('/hello', (req,res) => res.send(`Hello ${req.body.name}!`))

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });

        const db = client.db('my-blog');

        await operations(db);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

/*
Get article info from the MongoDB database.
*/
app.get('/api/articles/:name', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articleInfo);
        }, res)
})



/*
Upvote a particular article
*/
app.post('/api/articles/:name/upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;    //Get article name from url

        const articleInfo = await db.collection('articles').findOne({ name: articleName }); //Extract the required article JSON from db

        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        });     //Add one to the upvotes property of the required article

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });  //fetch new updated article object

        res.status(200).json(updatedArticleInfo);   //return with successful status and send back updated object
    }, res);

});

/*
Downvote a particular article
*/
app.post('/api/articles/:name/downvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;    //Get article name from url

        const articleInfo = await db.collection('articles').findOne({ name: articleName }); //Extract the required article JSON from db

        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes - 1,
            },
        });     //Add one to the upvotes property of the required article

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });  //fetch new updated article object

        res.status(200).json(updatedArticleInfo);   //return with successful status and send back updated object
    }, res);

});


/*
Comment on a particular article
*/
app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const commentId = Date.now();
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text, commentId }),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

/*
Remove a comment on a particular article
*/
app.post('/api/articles/:name/delete-comment', (req, res) => {
    const { targetId } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.filter(comment => {
                    return comment.commentId !== targetId
                }),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});


/*
Allows the user to clear all comments on a particular article
*/
app.post('/api/articles/:name/delete-all-comments', (req, res) => {
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: [],
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);

});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => console.log('Listening on port 8000.'));