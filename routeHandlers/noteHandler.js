const utils = require("../utils.js");
const { v4: uuidv4 } = require('uuid');
const databaseName = "drealism";
const collectionName = "notes";

exports.getNotes = async function (url, pathSegments, db, request, response) {
   try {
      console.log("Fetching notes from the database...");
      const notes = await utils.retrieveFromDatabase(databaseName, collectionName);
      
      console.log("Retrieved notes:", notes);

      utils.statusCodeResponse(response, 200, JSON.stringify(notes), "application/json");
   } catch (error) {
      console.error("Error retrieving notes:", error);
      utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};

exports.createNotes = async function (url, pathSegments, db, request, response) {
    try {
        const requestBody = await utils.getBody(request);
        const noteData = JSON.parse(requestBody);

        if (!noteData.title || !noteData.content) {
            utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
            return;
        }

        // const user = getUser();
        // noteData.userId = getUser();
        
        noteData.noteId = uuidv4();

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

exports.updateNotes = async function (url, pathSegments, db, request, response) {
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

exports.deleteNotes = async function (url, pathSegments, db, request, response) {
   try {
       const noteId = pathSegments[1];

       await utils.removeFromDatabase("notes", { _id: noteId });

       utils.statusCodeResponse(response, 200, "Note deleted successfully", "text/plain");
   } catch (error) {
       console.error("Error deleting note:", error);
       utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};