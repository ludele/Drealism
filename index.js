const http = require("http");
const MongoClient = require("mongodb").MongoClient;

const port = 3000;

let staticFileServer = require("./staticFileServer")
let routeHandler = require("./routeHandler")

async function handleRequest(request, response) {

   let mongoConn = await MongoClient.connect("mongodb://127.0.0.1:27017")
   let db = mongoConn.db("drealism")

   let url = new URL(request.url, "https://" + request.headers.host);
   let path = url.pathname;
   let pathSegments = path.split("/").filter(function (element) {
      return element !== "";
   });

   if (pathSegments.length > 0 && pathSegments[0] === "static" && request.method === "GET") {

      staticFileServer.handleStaticFileRoute(pathSegments, response);
      return;
   }

   routeHandler.handleRoute(url, pathSegments, db, request, response)
}

const app = http.createServer(handleRequest);

app.listen(port, function () {
   console.log(`Listening to ${port}`);
});
