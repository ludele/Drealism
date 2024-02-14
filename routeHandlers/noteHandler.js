// Note-handler

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
        let db = await utils.connectToDatabase();
        let cookie = utils.readSessionCookie(request.headers.cookie, response);
        let session = await db.collection('sessions').findOne({ uuid: cookie.session });

        if (!session) {
            utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
            return;
        }

        let userId = session.account;

        let templatePath = './templates/main.maru';
        console.log("Fetching notes from the database...");
        let notes = await utils.retrieveFromDatabase("drealism", collectionName, { userId: userId });
        console.log("Retrieved notes:", notes);

        //notes.sort((a, b) => new Date(a.date) - new Date(b.date));

        notes.forEach(note => {
            note.title = utils.sanitizeInput(note.title);
            note.content = utils.sanitizeInput(note.content);
        });

        const fields = [
            { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
            { name: 'content', label: 'Content:', type: 'textarea', placeholder: 'Enter content' }
        ];

        let formHTML = utils.generateDynamicForm(fields, '/notes', 'POST');
        console.log(formHTML);

        const placeholders = {
            title: "Drealism: Notes",
            script: `<script type="text/javascript" src="/static/js/put-or-delete.js" defer></script>`,
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

        // Retrieve the specific note from the database
        const noteId = pathSegments[0];
        if (noteId) {
            templatePath = './templates/index.maru';
            const note = notes.find(note => note.noteId === noteId);

            const noteFields = [
                { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
                { name: 'content', label: 'Content:', type: 'textarea', placeholder: 'Enter content' }
            ];

            // For no forms, beside the delete
            const emptyFields = [];

            const currentValues = {
                title: note.title,
                content: note.content,
            };

            let formHTML = utils.generateDynamicForm(noteFields, `/notes/${note.noteId}`, 'PUT', currentValues)
            // Only shows a "submit" button with the name delete
            let deleteForm = utils.generateDynamicForm(emptyFields, `/notes/${note.noteId}`, "DELETE")

            if (note) {
                // Display the specific note
                placeholders.content = `
                    <div>
                        <p>${note.date} ${note.time}</p>
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

        let db = await utils.connectToDatabase();
        let cookie = utils.readSessionCookie(request.headers.cookie);
        let session = await db.collection('sessions').findOne({ uuid: cookie.session });

        if (!session) {
            utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
            return;
        }
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
        noteData.userId = session.account;
        noteData.categories = [];

        noteData.title = utils.sanitizeInput(params.get("title"));
        noteData.content = utils.sanitizeInput(params.get("content"));

        if (!noteData.title || !noteData.content || !session.account) {
            response.writeHead(302, { "Location": "/previous-page?error=Bad Request: Missing required fields" });
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
        console.log(rawData)
        let updatedNoteData = JSON.parse(rawData); 

        let { title, content } = updatedNoteData;

        title = await utils.sanitizeInput(title);
        content = await utils.sanitizeInput(content)

        if (!title || !content) {
            utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
            return;
        }

        await utils.updateInDatabase("notes", { noteId }, { title, content });

        response.writeHead(302, { "Location": "/" });
        response.end();
        return;

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
exports.deleteNotes = async function (url, pathSegments, request, response, noteId) {
    try {
        await utils.removeFromDatabase("notes", { noteId: noteId });

        response.writeHead(302, { "Location": "/notes" });
        response.end();
        return;
    } catch (error) {
        console.error("Error deleting note:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};
