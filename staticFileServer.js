const fs = require("fs").promises;

exports.handleStaticFileRoute = async function (pathSegments, response) {
   pathSegments[0] = "public";
   console.log(pathSegments)
   let path = pathSegments.join("/");

   let fileContents;
   try {
      console.log("Reading file:", path);
      fileContents = await fs.readFile(path, "utf-8");
   } catch (err) {
      console.error("Error reading the file:", err);
      if (err.code === "ENOENT") {
         response.writeHead(404, { "Content-Type": "text/plain" });
         response.end("404 Not Found");
      } else {
         response.writeHead(500, { "Content-Type": "text/plain" });
         response.end("Internal Server Error");
      }
   }

   let dotIndex = path.lastIndexOf('.');
   if (dotIndex === -1) {
       response.writeHead(400, { 'Content-Type': 'text/plain' });
       response.write('400 Bad Request');
       response.end();
       return;
   }
   let ext = path.substring(dotIndex + 1);

   let contentType;
   switch (ext) {
       case 'html':
           contentType = 'text/html';
           break;
       case 'css':
           contentType = 'text/css';
           break;
       case 'js':
           contentType = 'text/javascript';
           break;
       case 'jpg':
       case 'jpeg':
           contentType = 'image/jpeg';
           break;
       default:
           response.writeHead(500, { 'Content-Type': 'text/plain' });
           response.write('500 Internal Server Error');
           response.end();
           return;
   }

   response.writeHead(200, { 'Content-Type': contentType });
   response.write(fileContents);
   response.end();
}
