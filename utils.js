// utils.js 
// Contains general functionality, used in various parts of the code-base.
const { IncomingMessage, ServerResponse } = require('http');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

const fs = require("fs").promises;
const databaseName = "drealism"
const uri = `mongodb://127.0.0.1:27017/${databaseName}`;

const client = new MongoClient(uri);
let db;

const routes = [
    { name: "Index", url: "/" },
    { name: "Notes", url: "/notes" },
  //{ name: "Tasks", url: "/tasks" },
    { name: "Categories", url: "/categories" },
    { name: "Search", url: "/search" },
    { name: "User", url: "/user" },
    { name: "Log/in/out", url: "/login" },
    { name: "Register", url: "/register" },
];

/**
 * 
 * Function to effectivise the write(head) functionality in the code, to reduce rewrittes.
 * 
 * @param {IncomingMessage} response 
 * @param {any} code - The response code used by the statusCodeResponse-function (can be int or string)
 * @param {String} value - 
 * @param {String} type 
 */
function statusCodeResponse(response, code, value, type) {
    response.writeHead(code, { 'Content-Type': `${type}` });
    response.write(value);
    response.end();
}

/**
 * 
 * @returns {String} - Id containing the time of creation, making dupicate id's impossible.\
 * RandomPart containing a randomly generated string. These are merged.
 */
function generateCustomId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return timestamp + randomPart;
}

/**
 * Function to asynchronously be able to able to add data to a chunk\
 * using promises.
 * 
 * @param {ServerResponse} request 
 * @returns {promise<void>}
 */
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

/**
 * Function to connect to the database from anywhere.
 *  
 * @param {String} databaseName 
 * @returns {promise<void>}
 */
async function connectToDatabase() {
    let databaseName = "drealism"
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

/**
 * Function to eventually close the connection to the MongoDB-server.
 */
function closeDatabaseConnection() {
    client.close();
    console.log("Closed MongoDB connection");
}

/**
 * Function to save data to the database
 * 
 * @param {String} collectionName 
 * @param {any} data 
 */
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
/**
 * Function to retrieve data from the database.
 * 
 * @param {String} databaseName 
 * @param {String} collectionName 
 * @param {?} query 
 * @returns 
 */
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

/**
 * 
 * @param {*} usernameOrEmail 
 * @returns 
 */
async function findUser(usernameOrEmail) {
    const db = await connectToDatabase();
    return db.collection('accounts').findOne({
        $or: [
            { username: usernameOrEmail },
            { email: usernameOrEmail }
        ]
    });
}

/**
 * 
 * @param {String} template 
 * @param {String} placeholders 
 * @returns 
 */
async function replaceTemplatePlaceholders(template, placeholders) {
    return template.replace(/%\w+%/g, match => {
        const placeholderKey = match.slice(1, -1);
        const replacement = placeholders[placeholderKey] || match;
        return replacement !== undefined ? replacement : match;
    });
}

/**
 * 
 * @param {String} collectionName 
 * @param {String} filter 
 * @param {any} updatedData 
 */
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

/**
 * Retrieves all documents from a collection.
 * @param {String} collection the name of the collection to retrieve documents from.
 * @returns {Array} an array of documents from the specified collection.
 */
async function getAllDocuments(collection) {
    try {
        const db = await connectToDatabase();
        const docs = await db.collection(collection).find({}).toArray();
        return docs;
    } catch (error) {
        console.error(`Error fetching ${collection}:`, error);
        throw error;
    }
}
/**
 * Adds a session to the specified collection.
 * @param {String} collectionName The name of the collection to add the session to.
 * @param {Object} session The session object to be added.
 */
async function addSession(collectionName, session) {
    const db = await connectToDatabase();
    const collection = db.collection(collectionName)
    await collection.insertOne(session);
}
/**
 * Removes documents from a collection based on the provided filter.
 * @param {String} collectionName The name of the collection to remove documents from.
 * @param {Object} filter Filter to search for the object.
 */

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

/**
 * Applies placeholders to a template and sends the result as a response.
 * @param {String} templatePath The path to the template file.
 * @param {Object} placeholders Object containing placeholders and their values.
 * @param {Object} response The HTTP response object.
 */
async function applyTemplate(templatePath, placeholders, response) {
    try {
        let template = (await fs.readFile(templatePath)).toString();

        let replacedTemplate = await replaceTemplatePlaceholders(template, placeholders);

        replacedTemplate = decodeHtmlEntities(replacedTemplate);
        statusCodeResponse(response, 200, replacedTemplate, "text/html");
        return;
    } catch (error) {
        console.error("Error reading the template:", error);
        statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
        return;
    }
}

/**
 * Sanitizes input by replacing special characters.
 * @param {String} input The input string to be sanitized.
 * @returns {String} The sanitized input string.
 */
function sanitizeInput(input) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Decodes HTML entities
 * @param {String} text The text containing HTML entities.
 * @returns {String} The text with HTML entities decoded.
 */
function decodeHtmlEntities(text) {
    console.log("Original text:", text);
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };
    const decodedText = text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, match => entities[match] || match);
    console.log("Decoded text:", decodedText);
    return decodedText;
}

/**
 * Generates HTML code for a dynamic form.
 * @param {Array} fields Array of objects representing form fields.
 * @param {String} path The action path for the form.
 * @param {String} method The HTTP method for the form.
 * @param {Object} currentValues Object containing current values for form fields.
 * @returns {String} HTML code for the dynamic form.
 */
function generateDynamicForm(fields, path, method, currentValues = {}) {
    buttonText = method;
    if (!buttonText){
        buttonText = "Submit";
    }
    let formHTML = `<form id="${method}" class="box" action="${path}" method="${method}">`;

    fields.forEach((field) => {
        const currentValue = currentValues[field.name] || '';
        if (field.type === 'textarea') {
            formHTML += `
                <div>
                    <label for="${field.name}">${field.label}</label><br>
                    <textarea id="${field.name}" name="${field.name}" placeholder="${field.placeholder}">${currentValue}</textarea>
                </div>
            `;
        } else {
            formHTML += `
                <div>
                    <label for="${field.name}">${field.label}</label><br>
                    <input type="${field.type}" id="${field.name}" name="${field.name}" placeholder="${field.placeholder}" value="${currentValue}">
                </div>
            `;
        }
    });

    formHTML += `<button type="submit">${method}</button></form>`;

    return formHTML;
}

/**
 * Generates a list of routes as HTML list items.
 * @param {Array} userRoutes - Array of objects, each containing 'name' and 'url' properties for the route.
 * @returns {String} A string of HTML list items for each route.
 */
function generateRouteList(userRoutes) {
    let lis = "";

    userRoutes.forEach((route) => {
        lis += `<li class="header-box"><a href="${route.url}">${route.name}</a></li>`;
    });

    return lis;
}

/**
 * Creates a hash from the given data.
 * @param {String} data The data to be hashed.
 * @returns {String} The hashed data.
 */
async function createHash(data) {
    let dataWithPepper = data + process.env.pepper;
    let salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(dataWithPepper, salt);
}

/**
 * Compares a hashed value with the provided data.
 * @param {String} hashed The hashed value to compare against.
 * @param {String} data The data to compare.
 * @returns {Boolean} True if the data matches the hashed value, otherwise false.
 */
async function compareHash(hashed, data) {
    let dataWithPepper = data + process.env.pepper;
    return await bcrypt.compare(dataWithPepper, hashed);
}

/**
 * Creates a session object.
 * @param {String} accountId The ID of the account associated with the session.
 * @returns {Object} The created session object.
 */
async function createSession(accountId) {
    let expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 dagar från nu

    let session = {
        uuid: crypto.randomUUID(),
        account: accountId,
        expires: expires
    };

    return session;
}

/**
 * Generates HTML code for category options.
 * @param {Array} categories Array of category objects.
 * @returns {String} HTML code for category options.
 */
function generateCategoryOptions(categories) {
    return categories.map(category => 
        `<option value="${category.categoryId}">${category.title}</option>`
    ).join('');
}

/**
 * Converts session data to cookie format.
 * @param {String} sessionId The session ID.
 * @param {String} accountId The account ID.
 * @returns {Array} Array containing session and account cookies.
 */
function toSessionCookie(sessionId, accountId) {
    return [`session=${sessionId}; SameSite=Strict; Path=/`,
    `account=${accountId}; SameSite=Strict; Path=/`];
}

/**
 * Reads session data from cookie format.
 * @param {String} cookieString The session cookie string.
 * @param {Object} response The HTTP response object.
 * @returns {Object} Object containing session and account data.
 */
function readSessionCookie(cookieString, response) {

    if (!cookieString) {
        statusCodeResponse(response, 404, "Your browser does not have cookies enabled, required for login", "text/plain");
        return null;
    }
    else {
        let keyValuePairs = cookieString.split(';');

        let session;
        let account;

        for (let i = 0; i < keyValuePairs.length; i++) {
            let pair = keyValuePairs[i].trim().split('=');

            if (pair[0] === 'session') {
                session = pair[1];
            } else if (pair[0] === 'account') {
                account = pair[1];
            }
        }

        return { session: session, account: account };
    }
}

module.exports = {
    createHash,
    compareHash,
    createSession,
    toSessionCookie,
    addSession,
    readSessionCookie,
    statusCodeResponse,
    getBody,
    saveToDatabase,
    getAllDocuments,
    generateCategoryOptions,
    findUser,
    connectToDatabase,
    retrieveFromDatabase,
    closeDatabaseConnection,
    replaceTemplatePlaceholders,
    updateInDatabase,
    generateCustomId,
    applyTemplate,
    removeFromDatabase,
    generateDynamicForm,
    generateRouteList,
    sanitizeInput,
    routes,
    db
};