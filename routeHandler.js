
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

exports.handleRoute = async function (url, pathSegments, request, response) {

   let title = "Drealism: Home page"
   let nav = "Navigation menu"
   let content = "Content"

   if (pathSegments.length === 0) {
      try {
         const templatePlaceholders = {
            title: `${title}`,
            nav: `${nav}`,
            content: `${content}`, 
         };

         await utils.applyTemplate(templatePath, templatePlaceholders, response);

         return;
      } catch (error) {
         console.error("Error applying the template:", error);
         return;
      }
   }

   if (pathSegments[0] === "static" && request.method === "GET") {
      staticFileServer.handleStaticFileRoute(pathSegments.slice(1), response);
      return;
   }

   let seg = pathSegments.shift()
   switch (seg) {
      case "categories":
         if (request.method === "GET") {
            categoryHandler.getCategories(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            categoryHandler.createCategories(url, pathSegments, request, response);
         }
         break;
      case "tags":
         if (request.method === "GET") {
            tagHandler.getTags(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            tagHandler.createTags(url, pathSegments, request, response);
         }
         break;
      case "user":
         userHandler.handleUserRoute(url, pathSegments, request, response);
         break;
      case "tasks":
         if (request.method === "GET") {
            taskHandler.getTasks(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            taskHandler.createTasks(url, pathSegments, request, response);
         }
         break;
      case "search":
         searchHandler.handleSearchRoute(url, pathSegments, request, response);
         break;
      case "login":
         if (request.method === "GET") {
            loginHandler.handleLogin(url, pathSegments, request, response);
         }
         break;
      case "logout":
         if (request.method === "GET") {
            loginHandler.handleLogout(url, pathSegments, request, response);
         }
         break;
      case "notes":
         if (request.method === "GET") {
            noteHandler.getNotes(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            noteHandler.createNotes(url, pathSegments, request, response);
         }
         break;
   }
}
