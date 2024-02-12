// utils.js 
// Contains general functionality, used in various parts of the code-base.
const { IncomingMessage, ServerResponse } = require('http');
const { MongoClient, Int32 } = require('mongodb');
const internal = require('stream');

const fs = require("fs").promises;
const databaseName = "drealism"
const uri = `mongodb://127.0.0.1:27017/${databaseName}`;

const client = new MongoClient(uri);
let db;

const routes = [
    { name: "Index", url: "/" },
    { name: "Notes", url: "/notes" },
    { name: "Tasks", url: "/tasks" },
    { name: "Categories", url: "/categories" },
    { name: "Tags", url: "/tags" },
    { name: "Search", url: "/search" },
    { name: "User", url: "/user" },
    { name: "Login", url: "/login" },
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
 * 
 * @param {String} databaseName 
 * @returns {promise<void>}
 */
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

/**
 * Function to eventually close the connection to the MongoDB-server.
 */
function closeDatabaseConnection() {
    client.close();
    console.log("Closed MongoDB connection");
}

/**
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
 * 
 * @param {String} collectionName 
 * @param {String} filter 
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

function sanitizeInput(input) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

function generateDynamicForm(fields, path, method, currentValues = {}) {
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

    formHTML += '<button type="submit">Submit</button></form>';

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

module.exports = {
    statusCodeResponse,
    getBody,
    saveToDatabase,
    connectToDatabase,
    retrieveFromDatabase,
    closeDatabaseConnection,
    replaceTemplatePlaceholders,
    updateInDatabase,
    sessionMiddleware,
    generateCustomId,
    applyTemplate,
    removeFromDatabase,
    generateDynamicForm,
    generateRouteList,
    sanitizeInput,
    routes
};