// utils.js 
// Contains general functionality, used in various parts of the code-base.
const { MongoClient } = require('mongodb');

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

function statusCodeResponse(response, code, value, type) {
    response.writeHead(code, { 'Content-Type': `${type}` });
    response.write(value);
    response.end();
}

async function getBody(request) {
    return new Promise(async function (resolve, reject) {
        let chunks = [];

        request.on("data", function (chunk) {
            chunks.push(chunk);
        });

        request.on("error", function (err) {
            reject(err);
        });

        request.on("end", function () {
            try {
                let data = Buffer.concat(chunks).toString();
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    });

}

async function connectToDatabase(databaseName) {
    try {
       if (!client || !client.topology || !client.topology.isConnected()) {
          await client.connect();
       }
       console.log("Connected to MongoDB");
       db = client.db(databaseName);
       return db;
    } catch (error) {
       console.error("Error connecting to MongoDB:", error);
       throw error;
    }
 }
 
 
 function closeDatabaseConnection() {
    client.close();
    console.log("Closed MongoDB connection");
} 

async function saveToDatabase(collectionName, data) {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(collectionName);

        if (Array.isArray(data)) {
            await collection.insertMany(data);
        } else {
            await collection.insertOne(data);
        }

        console.log(`Data saved to ${collectionName}`);
    } catch (error) {
        console.error(`Error saving data to ${collectionName}:`, error);
        throw error;
    }
}

async function retrieveFromDatabase(databaseName, collectionName, query = {}) {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(collectionName);

        const result = await collection.find(query).toArray();

        console.log(`Retrieved data from ${collectionName}`);
        return result;
    } catch (error) {
        console.error(`Error retrieving data from ${collectionName}:`, error);
        throw error;
    }
}

async function replacePlaceholdersByDictionary(template, placeholders) {
    return template.replace(/%\w+%/g, match => {
        const placeholderKey = match.slice(1, -1);
        const replacement = placeholders[placeholderKey] || match;
        return replacement !== undefined ? replacement : match;
    });
}

async function updateInDatabase(collectionName, filter, updatedData) {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(collectionName);

        await collection.updateOne(filter, { $set: updatedData });

        console.log(`Updated data in ${collectionName}`);
    } catch (error) {
        console.error(`Error updating data in ${collectionName}:`, error);
        throw error;
    }
}

async function removeFromDatabase(collectionName, filter) {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(collectionName);

        await collection.deleteOne(filter);

        console.log(`Removed data from ${collectionName}`);
    } catch (error) {
        console.error(`Error removing data from ${collectionName}:`, error);
        throw error;
    }
}

const sessions = {};

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function sessionMiddleware(request, response, next) {
    const sessionId = request.cookies.sessionId;

    if (sessionId && sessions[sessionId]) {
        request.session = sessions[sessionId];
    } else {
        const newSessionId = generateSessionId();
        request.session = {
            userId: null,
        };
        sessions[newSessionId] = request.session;

        response.setHeader('Set-Cookie', `sessionId=${newSessionId}; Path=/; HttpOnly`);
    }
    next();
}

module.exports = {
    statusCodeResponse,
    getBody,
    saveToDatabase,
    retrieveFromDatabase,
    replacePlaceholdersByDictionary,
    updateInDatabase,
    sessionMiddleware,
    removeFromDatabase
};