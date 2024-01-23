const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToDatabase() {
   try {
      await client.connect();
      console.log("Connected to MongoDB");
      db = client.db("your-database-name");
   } catch (error) {
      console.error("Error connecting to MongoDB:", error);
   }
}

function closeDatabaseConnection() {
   client.close();
   console.log("Closed MongoDB connection");
}

module.exports = { connectToDatabase, closeDatabaseConnection };