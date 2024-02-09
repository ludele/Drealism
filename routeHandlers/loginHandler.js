const utils = require("../utils.js");
const templatePath = "./templates/index.maru"
const routes = utils.routes; 

exports.handleLogin = async function (url, pathSegments, request, response) {
   let title = "Drealism: Login page";
   let nav = `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                <div/>
             `

   const userFormFields = [
      { name: "username", label: "Username", placeholder: "Enter your username" },
      { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
   ];

   const userFormHTML = utils.generateDynamicForm(userFormFields);

   if (pathSegments.length === 0) {
      try {
         const templatePlaceholders = {
            title: `${title}`,
            nav: `${nav}`,
            content: `${userFormHTML}` 
         };

         await utils.applyTemplate(templatePath, templatePlaceholders, response);

         return;
      } catch (error) {
         console.error("Error applying the template:", error);
         return;
      }
   }
}

exports.handleLogout = async function (url, pathSegments, db, request, response) {
   console.log("test");
}
