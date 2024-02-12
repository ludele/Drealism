// noteHandler.js

const utils = require("../utils.js");
const collectionName = "notes";

const routes = utils.routes;

/**
 * Fetches notes from the database and sends them as a JSON response.
 * 
 * This is to be able to give the user a list of notes - to give access to them in a reasonable manner.
 *              
 * @param {string} url - The URL of the request.
 * @param {Array} pathSegments - An array representing the path segments of the requested URL.
 * @param {http.IncomingMessage} request - The HTTP request object.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after fetching and sending the notes.
 */ 
exports.getNotes = async function (url, pathSegments, request, response) {
    try {
        let templatePath = './templates/main.maru';
        console.log("Fetching notes from the database...");
        let notes = await utils.retrieveFromDatabase("drealism", collectionName);
        console.log("Retrieved notes:", notes);

        //notes.sort((a, b) => new Date(a.date) - new Date(b.date));

        notes.forEach(note => {
            note.title = utils.sanitizeInput(note.title);
            note.content = utils.sanitizeInput(note.content.substring(0, 100)); // Showing a preview of the content
        });

        const fields = [
            { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
            { name: 'content', label: 'Content:', type: 'textarea', placeholder: 'Enter content' }
        ];

        let formHTML = utils.generateDynamicForm(fields, '/notes', 'POST');
        console.log(formHTML);

        // Prepare placeholders with title as a link and some content
        // Adjust the URL to the note based on your application's routing
        const placeholders = {
            title: "Drealism: Notes",
            script: `<script type="text/javascript" src="/static/js/put.js" defer></script>`,
            nav:
            `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                <div/>
            `,
            form: formHTML, 
            content: notes.map(note =>
            `   <div>
                    <li class="small-box">
                        <a class="box" href="/notes/${note.noteId}">${note.title}</a>
                        <p class="small-box">${note.content.substring(0, 100)}...</p> <!-- Showing a preview of the content -->
                        <span class="small-box">${note.date} ${note.time}</span>
                    </li>
                <div/>
            `
            ).join('')
        };

    const noteId = pathSegments[0];
        if (noteId) {
            // Retrieve the specific note from the database
            templatePath = './templates/index.maru';
            const note = notes.find(note => note.noteId === noteId);

            const noteFields = [
                { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
                { name: 'content', label: 'Content:', type: 'textarea', placeholder: 'Enter content' }
            ];
            
            const currentValues = {
                title: note.title,
                content: note.content,

            };
            
            let formHTML = utils.generateDynamicForm(noteFields, `/notes/${note.noteId}`, 'PUT', currentValues)

            if (note) {
                // Display the specific note
                placeholders.content = `
                    <div>
                        <h2>${note.title}</h2>
                        <p>${note.content}</p>
                        <p>${note.date} ${note.time}</p>
                    </div>
                    ${formHTML}
                `;
            } else {
                // Note not found
                placeholders.content = "<p>Note not found</p>";
            }
        }

        await utils.applyTemplate(templatePath, placeholders, response);
    } catch (error) {
        console.error("Error retrieving notes:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
}

/**
 * Creates a new note with the data provided in the request body, saves it to the database,
 * and sends a response indicating the operation's success or failure.
 *
 * @param {string} url - The URL of the request.
 * @param {Array} pathSegments - An array representing the path segments of the requested URL.
 * @param {http.IncomingMessage} request - The HTTP request object, containing the note data in its body.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after creating the note and sending a response.
 */
exports.createNotes = async function (url, pathSegments, request, response) {
    try {
        const requestBody = await utils.getBody(request);
        //const noteData = JSON.parse(requestBody);
        let params = new URLSearchParams(requestBody);

        // const user = getUser();
        // noteData.userId = getUser();

        let noteData = {};
        
        noteData.noteId = utils.generateCustomId();

        const currentDate = new Date();
        noteData.date = currentDate.toISOString().split('T')[0];
        noteData.time = currentDate.toTimeString().split(' ')[0];

        noteData.title = utils.sanitizeInput(params.get("title"));
        noteData.content = utils.sanitizeInput(params.get("content"));

        if (!noteData.title || !noteData.content) {
            response.writeHead(302, {"Location": "/previous-page?error=Bad Request: Missing required fields"});
            response.end();
            return;
        }

        await utils.saveToDatabase("notes", noteData);

        utils.statusCodeResponse(response, 201, "Note created successfully", "text/plain");
    } catch (error) {
        console.error("Error creating note:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};
/**
 * Updates an existing note identified by an ID in the path segment, using the data provided
 * in the request body, and sends a response indicating the operation's success or failure.
 *
 * @param {string} url - The URL of the request.
 * @param {Array} pathSegments - An array representing the path segments of the requested URL, including the note ID.
 * @param {http.IncomingMessage} request - The HTTP request object, containing the updated note data in its body.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after updating the note and sending a response.
 */
exports.updateNotes = async function (url, pathSegments, request, response, noteId) {
    try {
        let rawData = await utils.getBody(request);
        const updatedNoteData = JSON.parse(rawData); // Parse the raw body data as JSON

        const { title, content } = updatedNoteData; // Destructure the updated data

        if (!title || !content) {
            utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
            return;
        }

        // Assuming your utility function correctly updates the note by noteId
        await utils.updateInDatabase("notes", { noteId }, { title, content });

        utils.statusCodeResponse(response, 200, "Note updated successfully", "application/json");
    } catch (error) {
        console.error("Error updating note:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};

/**
 * Deletes an existing note from the database.
 * @param {string} url - The url of the request.
 * @param {Array} pathSegments - An array containing the pathSegments
 * @param {http.IncomingMessage} request - HTTP request object
 * @param {http.ServerResponse} response - HTTP response object
 * @returns {Promise<void>} - Resolves after deleting the note
 */
exports.deleteNotes = async function (url, pathSegments, request, response) {
   try {
       const noteId = pathSegments[1];

       await utils.removeFromDatabase("notes", { _id: noteId });

       utils.statusCodeResponse(response, 200, "Note deleted successfully", "text/plain");
   } catch (error) {
       console.error("Error deleting note:", error);
       utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};