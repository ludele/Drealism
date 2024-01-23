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

async function retrieveFromDatabase(collectionName, query = {}) {
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

module.exports = {
   statusCodeResponse,
   getBody,
   saveToDatabase,
   retrieveFromDatabase,
   replacePlaceholdersByDictionary
 };