// Category-handler

const utils = require("../utils.js");
const collectionName = "categories";

const routes = utils.routes;
/**
 * Fetches categories from the database and sends them as a JSON response.
 * 
 * This is to be able to give the user a list of categories - to give access to them in a reasonable manner.
 *              
 * @param {string} url - The URL of the request.
 * @param {Array} pathSegments - An array representing the path segments of the requested URL.
 * @param {http.IncomingMessage} request - The HTTP request object.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after fetching and sending the categories.
 */ 
exports.getCategories = async function (url, pathSegments, request, response) {
    try {
        let db = await utils.connectToDatabase();
        let cookie = utils.readSessionCookie(request.headers.cookie, response);
        let session = await db.collection('sessions').findOne({uuid: cookie.session});

        if (!session) {
            utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
            return;
        }

        let userId = session.account; 

        let templatePath = './templates/main.maru';
        console.log("Fetching categories from the database...");
        let categories = await utils.retrieveFromDatabase("drealism", collectionName, { userId: userId });
        console.log("Retrieved categories:", categories);

        //categories.sort((a, b) => new Date(a.date) - new Date(b.date));

        categories.forEach(category => {
            category.title = utils.sanitizeInput(category.title);
        });

        const fields = [
            { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
        ];

        let formHTML = utils.generateDynamicForm(fields, '/categories', 'POST');
        console.log(formHTML);

        const placeholders = {
            title: "Drealism: Categories",
            script: `<script type="text/javascript" src="/static/js/put-or-delete.js" defer></script>`,
            nav:
            `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                <div/>
            `,
            form: formHTML,
             
            content: categories.map(category =>
            `   <div>
                    <li class="small-box">
                        <a class="box" href="/categories/${category.categoryId}">${category.title}</a>
                        <span class="small-box">${category.date} ${category.time}</span>
                    </li>
                <div/>
            `
            ).join('')
        };

    const categoryId = pathSegments[0];
        if (categoryId) {
            // Retrieve the specific category from the database
            templatePath = './templates/index.maru';
            const category = categories.find(category => category.categoryId === categoryId);

            const categoryFields = [
                { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
            ];

            // For no forms beside the delete
            const emptyFields = [];

            const currentValues = {
                title: category.title,
                content: category.content,
            };
            
            let formHTML = utils.generateDynamicForm(categoryFields, `/categories/${category.categoryId}`, 'PUT', currentValues)
            // Only shows a "submit" button with the name delete
            let deleteForm = utils.generateDynamicForm(emptyFields, `/categories/${category.categoryId}`, "DELETE")
            
            if (category) {
                // Display the specific category
                placeholders.content = `
                    <div>
                        <p>${category.date} ${category.time}</p>
                    </div>
                    ${formHTML}
                    ${deleteForm}
                `;
            } else {
                // Note not found
                placeholders.content = "<p>Note not found</p>";
            }
        }

        await utils.applyTemplate(templatePath, placeholders, response);
    } catch (error) {
        console.error("Error retrieving categories:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
}

/**
 * Creates a new category with the data provided in the request body, saves it to the database,
 * and sends a response indicating the operation's success or failure.
 *
 * @param {string} url - The URL of the request.
 * @param {Array} pathSegments - An array representing the path segments of the requested URL.
 * @param {http.IncomingMessage} request - The HTTP request object, containing the category data in its body.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after creating the category and sending a response.
 */
exports.createCategories = async function (url, pathSegments, request, response) {
    try {

        let db = await utils.connectToDatabase();
        let cookie = utils.readSessionCookie(request.headers.cookie);
        let session = await db.collection('sessions').findOne({uuid: cookie.session});

        if (!session) {
            utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
            return;
        }
        const requestBody = await utils.getBody(request);
        //const categoryData = JSON.parse(requestBody);
        let params = new URLSearchParams(requestBody);

        // const user = getUser();
        // categoryData.userId = getUser();

        let categoryData = {};
        
        categoryData.categoryId = utils.generateCustomId();

        const currentDate = new Date();
        categoryData.date = currentDate.toISOString().split('T')[0];
        categoryData.time = currentDate.toTimeString().split(' ')[0];
        categoryData.userId = session.account;

        categoryData.title = utils.sanitizeInput(params.get("title"));

        if (!categoryData.title || !session.account) {
            response.writeHead(302, {"Location": "/previous-page?error=Bad Request: Missing required fields"});
            response.end();
            return;
        }

        await utils.saveToDatabase("categories", categoryData);

        utils.statusCodeResponse(response, 201, "Note created successfully", "text/plain");
    } catch (error) {
        console.error("Error creating category:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};
/**
 * Updates an existing category identified by an ID in the path segment, using the data provided
 * in the request body, and sends a response indicating the operation's success or failure.
 *
 * @param {string} url - The URL of the request.
 * @param {Array} pathSegments - An array representing the path segments of the requested URL, including the category ID.
 * @param {http.IncomingMessage} request - The HTTP request object, containing the updated category data in its body.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after updating the category and sending a response.
 */
exports.updateCategories = async function (url, pathSegments, request, response, categoryId) {
    try {
        let rawData = await utils.getBody(request);
        console.log(rawData)
        let updatedNoteData = JSON.parse(rawData); // Parse the raw body data as JSON
        
        let { title } = updatedNoteData; // Destructure the updated data

        title = await utils.sanitizeInput(title);

        if (!title) {
            utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
            return;
        }

        await utils.updateInDatabase("categories", { categoryId }, { title });

        response.writeHead(302, {"Location": "/"});
        response.end();
        return;

    } catch (error) {
        console.error("Error updating category:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};

/**
 * Deletes an existing category from the database.
 * @param {string} url - The url of the request.
 * @param {Array} pathSegments - An array containing the pathSegments
 * @param {http.IncomingMessage} request - HTTP request object
 * @param {http.ServerResponse} response - HTTP response object
 * @returns {Promise<void>} - Resolves after deleting the category
 */
exports.deleteCategories = async function (url, pathSegments, request, response, categoryId) {
   try {
       await utils.removeFromDatabase("categories", { categoryId: categoryId });

       response.writeHead(302, {"Location": "/categories"});
       response.end();
       return;
   } catch (error) {
       console.error("Error deleting category:", error);
       utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};