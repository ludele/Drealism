const http = require("http");
const port = 3002;

const utils = require("./utils.js");

let staticFileServer = require("./staticFileServer")
let routeHandler = require("./routeHandler")

/**
 * Initializes and handles incoming HTTP requests for the web server. 
 * Acts as the central dispatcher for all incoming HTTP requests, 
 * routing them based on their URL and HTTP method to the specific handlers.
 * 
 * @param {http.IncomingMessage} request 
 * - The incoming HTTP request object, providing request details such as URL and headers.
 * @param {http.ServerResponse} response 
 * - The outgoing HTTP response object, used to send responses back to the client.
 * @returns {Promise<void>} 
 * - Although this async function does not explicitly return a value; utilizes asynchronous operations to handle requests.
 */
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

// If the server closes, then the connection to MongoDB closes.
process.on('SIGINT', async () => {
   console.log('Closing MongoDB Connection due to application exit');
   await utils.closeDatabaseConnection();
   process.exit(0);
});

app.listen(port, function () {
   console.log(`Listening to ${port}`);
});
