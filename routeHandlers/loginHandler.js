const utils = require("../utils.js");
const templatePath = "./templates/default.maru"
const routes = utils.routes;

exports.getLogin = async function (url, pathSegments, request, response) {
   let db = await utils.connectToDatabase();
   let cookie; 
   cookie = utils.readSessionCookie(request.headers.cookie, response);

   if (!cookie || typeof cookie.session === 'undefined' || typeof cookie.account === 'undefined') {
      return;
   }

   let session = await db.collection('sessions').findOne({
      uuid: cookie.session,
      account: cookie.account
   });

   if (session) {
      handleLogout(url, pathSegments, request, response)
      return;
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

exports.postLogin = async function (url, pathSegments, request, response) {
   let db = await utils.connectToDatabase();
   let data = await utils.getBody(request);
   let searchParams = new URLSearchParams(data);

   const results = await utils.retrieveFromDatabase('drealism', 'accounts', {
      $or: [
          { username: searchParams.get('username') },
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

exports.postRegister = async function (url, pathSegments, request, response) {
   let data = await utils.getBody(request);
   let searchParams = new URLSearchParams(data);

   let passwordHash = await utils.createHash(searchParams.get('password'));

   let account = {
      uuid: crypto.randomUUID(),
      username: searchParams.get('username'),
      name: searchParams.get('name'),
      password: passwordHash
   };

   await utils.saveToDatabase("accounts", account)

   response.writeHead(303, {
      'Location': '/'
   });
   response.end();
   return;
}