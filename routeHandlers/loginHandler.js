const utils = require("../utils.js");
const templatePath = "./templates/default.maru"
const routes = utils.routes;

/**
 * Handles GET request to the login page.
 * @param {String} url The requested URL.
 * @param {Array} pathSegments An array of path segments.
 * @param {Object} request The HTTP request object.
 * @param {Object} response The HTTP response object.
 */

exports.getLogin = async function (url, pathSegments, request, response) {
   let db = await utils.connectToDatabase();

   let cookieHeader = request.headers.cookie;
   let cookie;
   if (cookieHeader) {
     cookie = utils.readSessionCookie(cookieHeader, response);
   }
   
   // Proceed only if cookie is defined and has the necessary properties
   if (cookie && cookie.session && cookie.account) {
     // Check if the cookies match a session in the database.
     var session = await db.collection('sessions').findOne({
       uuid: cookie.session,
       account: cookie.account
     });
   
     // If the session exists, then the login page causes a logout.
     if (session) {
       handleLogout(url, pathSegments, request, response);
       return;
     }
   }
   
   let title = "Drealism: Login page";
   let nav = `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                 <div/>
             `

   const userFormFields = [
      { name: "username", label: "Username", placeholder: "Enter your username" },
      { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
   ];

   const userFormHTML = utils.generateDynamicForm(userFormFields, "/login", "POST");

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

/**
 * Handles POST request to the login page.
 * @param {String} url The requested URL.
 * @param {Array} pathSegments An array of path segments.
 * @param {Object} request The HTTP request object.
 * @param {Object} response The HTTP response object.
 */
exports.postLogin = async function (url, pathSegments, request, response) {
   let db = await utils.connectToDatabase();
   let data = await utils.getBody(request);
   let searchParams = new URLSearchParams(data);

   const results = await utils.retrieveFromDatabase('drealism', 'accounts', {
      $or: [
          { username: utils.sanitizeInput(searchParams.get('username')) },
      ]
   });

   const account = results[0];

   if (!account || !(await utils.compareHash(account.password, searchParams.get('password')))) {
      response.writeHead(401, { 'Content-Type': 'text/plain' });
      response.write('401 Unauthorized');
      response.end();
      return;
   }

   let session = await utils.createSession(account.uuid);
   await utils.addSession("sessions", session)

   response.writeHead(303, {
      'Location': '/user',
      'Set-Cookie': utils.toSessionCookie(session.uuid, session.account)
   });
   response.write('200 OK');
   response.end();
   return;
}

/**
 * Handles logout functionality.
 * @param {String} url The requested URL.
 * @param {Array} pathSegments An array of path segments.
 * @param {Object} request The HTTP request object.
 * @param {Object} response The HTTP response object.
 */
handleLogout = async function (url, pathSegments, request, response) {
   let db = await utils.connectToDatabase();
   let cookie = utils.readSessionCookie(request.headers.cookie, response);
   let session = await db.collection('sessions').findOne({
      uuid: cookie.session,
      account: cookie.account
   });

   db.collection('sessions').deleteOne({ uuid: session.uuid }); 

   response.writeHead(303, {
      'Location': '/',
      'Set-Cookie': ['session=; Path=/; Max-Age: 0', 'account=; Path=/; Max-Age: 0'] 
   });
   response.end();
   return;
}

/**
 * Handles GET request to the register page.
 * @param {String} url The requested URL.
 * @param {Array} pathSegments An array of path segments.
 * @param {Object} request The HTTP request object.
 * @param {Object} response The HTTP response object.
 */
exports.getRegister = async function (url, pathSegments, request, response) {
   let title = "Drealism: Register page";
   let nav = `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                <div/>
             `

   const userFormFields = [
      { name: "name", label: "Name", placeholder: "Enter your Name" },
      { name: "username", label: "Username", placeholder: "Enter your username" },
      { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
   ];

   const userFormHTML = utils.generateDynamicForm(userFormFields, "/register", "POST");

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

/**
 * Handles POST request to the register page.
 * @param {String} url The requested URL.
 * @param {Array} pathSegments An array of path segments.
 * @param {Object} request The HTTP request object.
 * @param {Object} response The HTTP response object.
 */
exports.postRegister = async function (url, pathSegments, request, response) {
   let data = await utils.getBody(request);
   let searchParams = new URLSearchParams(data);

   let passwordHash = await utils.createHash(searchParams.get('password'));

   let account = {
      uuid: crypto.randomUUID(),
      username: utils.sanitizeInput(searchParams.get('username')),
      name: utils.sanitizeInput(searchParams.get('name')),
      password: passwordHash
   };

   await utils.saveToDatabase("accounts", account)

   response.writeHead(303, {
      'Location': '/'
   });
   response.end();
   return;
}