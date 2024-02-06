// noteHandler.js

const utils = require("../utils.js");
const collectionName = "notes";

const routes = [
    { name: "Notes", url: "/notes" },
    { name: "Tasks", url: "/tasks" },
    { name: "Categories", url: "/categories" },
    { name: "Tags", url: "/tags" },
    { name: "Search", url: "/search" },
    { name: "User", url: "/user" },
    { name: "Login", url: "/login" },

];

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
        console.log("Fetching notes from the database...");
        let notes = await utils.retrieveFromDatabase("drealism", collectionName);
        console.log("Retrieved notes:", notes);

        // Sort notes by date (newest first)
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Prepare placeholders with title as a link and some content
        // Adjust the URL to the note based on your application's routing
        const placeholders = {
            title: "Drealism: Notes",
            nav:
                `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                <div/>
            `,
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

        const templatePath = './templates/index.maru';

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
        const noteData = JSON.parse(requestBody);

        if (!noteData.title || !noteData.content) {
            utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
            return;
        }

        // const user = getUser();
        // noteData.userId = getUser();
        
        noteData.noteId = utils.generateCustomId();

        const currentDate = new Date();
        noteData.date = currentDate.toISOString().split('T')[0];
        noteData.time = currentDate.toTimeString().split(' ')[0];

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
exports.updateNotes = async function (url, pathSegments, request, response) {
   try {
       const noteId = pathSegments[1];

       const requestBody = await utils.getBody(request);
       const updatedNoteData = JSON.parse(requestBody);

       if (!updatedNoteData.title || !updatedNoteData.content) {
           utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
           return;
       }


       await utils.updateInDatabase("notes", { _id: noteId }, updatedNoteData);

       utils.statusCodeResponse(response, 200, "Note updated successfully", "text/plain");
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