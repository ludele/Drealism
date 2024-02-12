
const utils = require("./utils.js");

const templatePath = "./templates/index.maru"

const noteHandler = require("./routeHandlers/noteHandler.js");
const categoryHandler = require("./routeHandlers/categoryHandler.js");
const userHandler = require("./routeHandlers/userHandler.js");
const searchHandler = require("./routeHandlers/searchHandler.js");
const loginHandler = require("./routeHandlers/loginHandler.js");
const staticFileServer = require("./staticFileServer.js");

exports.handleRoute = async function (url, pathSegments, request, response) {

   let title = "Drealism: Home page"
   let nav = `   <div class="header-box">
                    ${utils.generateRouteList(utils.routes)}
                <div/>
             `
   let content = "Index page for Drealism!"

   if (pathSegments.length === 0) {
      try {
         const templatePlaceholders = {
            title: `${title}`,
            script: ` `,
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
         } else if (pathSegments.length === 1 && request.method === "PUT") {
            categoryHandler.updateCategories(url, pathSegments, request, response, pathSegments[0]);
         } else if (pathSegments.length === 1 && request.method === "DELETE") {
            categoryHandler.deleteCategories(url, pathSegments, request, response, pathSegments[0]);
         }
         break;
      case "user":
         userHandler.handleUserRoute(url, pathSegments, request, response);
         break;
      // Tried search handler.
      case "search":
         searchHandler.handleSearchRoute(url, pathSegments, request, response);
         break;
      case "login":
         if (request.method === "GET") {
            loginHandler.getLogin(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            loginHandler.postLogin(url, pathSegments, request, response)
         }
         break;
      case "register":
         if (request.method === "GET") {
            loginHandler.getRegister(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            loginHandler.postRegister(url, pathSegments, request, response);
         }
         break;
      case "notes":
         if (request.method === "GET") {
            noteHandler.getNotes(url, pathSegments, request, response);
         } else if (request.method === "POST") {
            noteHandler.createNotes(url, pathSegments, request, response);
         } else if (pathSegments.length === 1 && request.method === "PUT") {
            noteHandler.updateNotes(url, pathSegments, request, response, pathSegments[0]);
         } else if (pathSegments.length === 1 && request.method === "DELETE") {
            noteHandler.deleteNotes(url, pathSegments, request, response, pathSegments[0]);
         }
         break;
   }
}
