const utils = require("../utils.js");
let templatePath = "./templates/default.maru"

exports.handleUserRoute = async function (url, pathSegments, request, response) {
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

   if (!session) {
      response.writeHead(403, { 'Content-Type': 'text/plain' });
      response.write('403 Forbidden');
      response.end();
      return;
   }

   // sessionen har gått ut
   if (new Date() > session.expires) {
      db.collection('sessions').deleteOne({ uuid: session.uuid }); // kör denna i bakgrunden för att inte blockera resten av koden

      response.writeHead(403, {
         'Content-Type': 'text/plain',
         'Set-Cookie': ['session=; Path=/; Max-Age: 0', 'account=; Path=/; Max-Age: 0'] // tar bort utgångna cookies från användarens webbläsare
      });
      response.write('403 Forbidden');
      response.end();
      return;
   }

   let user = await db.collection('accounts').findOne({ uuid: session.account });

    if (!user) {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('404 User Not Found');
        response.end();
        return;
    }

   let title = `Drealism: ${user.username}`
   let nav = `   <div class="header-box">
                    ${utils.generateRouteList(utils.routes)}
                <div/>
             `
   let content = `Welcome ${user.name}`
      try {
         const templatePlaceholders = {
            title: `${title}`,
            script: ` `,
            nav: `${nav}`,
            content: `${content}`, 
         };

         await utils.applyTemplateNoDecode(templatePath, templatePlaceholders, response);

         return;
      } catch (error) {
         console.error("Error applying the template:", error);
         return;
      }
   }   
exports.deleteUser = async function (token, userId) {
   
}