//taskHandler.js

const utils = require("../utils.js");
const collectionName = "tasks";

exports.getTasks = async function (url, pathSegments, db, request, response) {
   try {
      console.log("Fetching tasks from the database...");
      const tasks = await utils.retrieveFromDatabase("your_database_name", collectionName);
      console.log("Retrieved tasks:", tasks);

      utils.statusCodeResponse(response, 200, JSON.stringify(tasks), "application/json");
   } catch (error) {
      console.error("Error retrieving tasks:", error);
      utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};

exports.createTasks = async function (url, pathSegments, db, request, response) {
    try {
        const requestBody = await utils.getBody(request);
        const taskData = JSON.parse(requestBody);

        if (!taskData.title || !taskData.description) {
            utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
            return;
        }

        taskData.taskId = utils.generateCustomId();

        const currentDate = new Date();
        taskData.date = currentDate.toISOString().split('T')[0];
        taskData.time = currentDate.toTimeString().split(' ')[0];

        await utils.saveToDatabase("tasks", taskData);

        utils.statusCodeResponse(response, 201, "Task created successfully", "text/plain");
    } catch (error) {
        console.error("Error creating task:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};

exports.updateTasks = async function (url, pathSegments, db, request, response) {
   try {
       const taskId = pathSegments[1];

       const requestBody = await utils.getBody(request);
       const updatedTaskData = JSON.parse(requestBody);

       if (!updatedTaskData.title || !updatedTaskData.description) {
           utils.statusCodeResponse(response, 400, "Bad Request: Missing required fields", "text/plain");
           return;
       }

       await utils.updateInDatabase("tasks", { _id: taskId }, updatedTaskData);

       utils.statusCodeResponse(response, 200, "Task updated successfully", "text/plain");
   } catch (error) {
       console.error("Error updating task:", error);
       utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};

exports.deleteTasks = async function (url, pathSegments, db, request, response) {
   try {
       const taskId = pathSegments[1];

       await utils.removeFromDatabase("tasks", { _id: taskId });

       utils.statusCodeResponse(response, 200, "Task deleted successfully", "text/plain");
   } catch (error) {
       console.error("Error deleting task:", error);
       utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
   }
};
