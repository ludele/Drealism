const http = require("http");
const port = 3000;

const utils = require("./utils.js");

let staticFileServer = require("./staticFileServer")
let routeHandler = require("./routeHandler")

async function handleRequest(request, response) {

   await utils.connectToDatabase("drealism");
   let url = new URL(request.url, "https://" + request.headers.host);
   let path = url.pathname;
   let pathSegments = path.split("/").filter(function (element) {
      return element !== "";
   });

   if (pathSegments.length > 0 && pathSegments[0] === "static" && request.method === "GET") {

      staticFileServer.handleStaticFileRoute(pathSegments, response);
      return;
   }

   routeHandler.handleRoute(url, pathSegments, request, response)
}

const app = http.createServer(handleRequest);

process.on('SIGINT', async () => {
   console.log('Closing MongoDB Connection due to application exit');
   await utils.closeDatabaseConnection();
   process.exit(0);
});

app.listen(port, function () {
   console.log(`Listening to ${port}`);
});
