const fs = require("fs").promises;
const path = require("path");
const utils = require("./utils.js");

const templatePath = "./templates/index.maru"

const noteHandler = require("./routeHandlers/noteHandler.js");
const categoryHandler = require("./routeHandlers/categoryHandler.js");
const tagHandler = require("./routeHandlers/tagHandler.js");
const userHandler = require("./routeHandlers/userHandler.js");
const taskHandler = require("./routeHandlers/taskHandler.js");
const searchHandler = require("./routeHandlers/searchHandler.js");
const loginHandler = require("./routeHandlers/loginHandler.js");
const staticFileServer = require("./staticFileServer.js");

exports.handleRoute = async function (url, pathSegments, db, request, response) {

   if (pathSegments.length === 0) {
      let template = (await fs.readFile(templatePath)).toString()
      utils.statusCodeResponse(response, 200, template, "text/html")
      return
   }

   if (pathSegments[0] === "static" && request.method === "GET") {
      staticFileServer.handleStaticFileRoute(pathSegments.slice(1), response);
      return;
   }

   utils.statusCodeResponse(response, 404, "404 Not Found", "text/plain");

   let seg = pathSegments.shift()
   switch (seg) {
      case "categories":
         if (request.method === "GET") {
            categoryHandler.getCategories(url, pathSegments, db, request, response);
         } else if (request.method === "POST") {
            categoryHandler.createCategories(url, pathSegments, db, request, response);
         }
         break;
      case "tags":
         if (request.method === "GET") {
            tagHandler.getTags(url, pathSegments, db, request, response);
         } else if (request.method === "POST") {
            tagHandler.createTags(url, pathSegments, db, request, response);
         }
         break;
      case "user":
         userHandler.handleUserRoute(url, pathSegments, db, request, response);
         break;
      case "tasks":
         if (request.method === "GET") {
            taskHandler.getTasks(url, pathSegments, db, request, response);
         } else if (request.method === "POST") {
            taskHandler.createTasks(url, pathSegments, db, request, response);
         }
         break;
      case "search":
         searchHandler.handleSearchRoute(url, pathSegments, db, request, response);
         break;
      case "login":
         if (request.method === "POST") {
            loginHandler.handleLogin(url, pathSegments, db, request, response);
         }
         break;
      case "logout":
         if (request.method === "POST") {
            loginHandler.handleLogout(url, pathSegments, db, request, response);
         }
         break;
      case "notes":
         if (request.method === "GET") {
            noteHandler.getNotes(url, pathSegments, db, request, response);
         } else if (request.method === "POST") {
            noteHandler.createNotes(url, pathSegments, db, request, response);
         }
         break;
   }
}
