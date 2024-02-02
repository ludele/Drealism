const fs = require("fs").promises;

/**
 * Handles static file routes by reading and serving the content of the requested file.
 *
 * @param {Array} pathSegments - An array representing the path segments of the requested file.
 * @param {http.ServerResponse} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves after handling the static file route.
 */
exports.handleStaticFileRoute = async function (pathSegments, response) {
   // Set the first path segment to "public" to indicate the location of static files.
   pathSegments[0] = "public";
   console.log(pathSegments);

   // Join the path segments to form the file path.
   let path = pathSegments.join("/");

   let fileContents;

   try {
      console.log("Reading file:", path);
      fileContents = await fs.readFile(path, "utf-8");
   } catch (err) {
      console.error("Error reading the file:", err);

      // Handle different types of errors.
      if (err.code === "ENOENT") {
         // File not found (404 Not Found).
         response.writeHead(404, { "Content-Type": "text/plain" });
         response.end("404 Not Found");
      } else {
         // Internal server error (500 Internal Server Error).
         response.writeHead(500, { "Content-Type": "text/plain" });
         response.end("Internal Server Error");
      }
      return;
   }

   // Find the index of the last dot in the file path to determine the file extension.
   let dotIndex = path.lastIndexOf('.');
   if (dotIndex === -1) {
       // Bad request (400 Bad Request) if no file extension is found.
       response.writeHead(400, { 'Content-Type': 'text/plain' });
       response.write('400 Bad Request');
       response.end();
       return;
   }

   // Get the file extension.
   let ext = path.substring(dotIndex + 1);

   let contentType;

   // getContentType
   // Choose and restrict the content type based on the file extension.
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
           // Unsupported file type (500 Internal Server Error).
           response.writeHead(500, { 'Content-Type': 'text/plain' });
           response.write('500 Internal Server Error');
           response.end();
           return;
   }

   // Set the appropriate content type in the response headers.
   response.writeHead(200, { 'Content-Type': contentType });
   
   // Write the file contents to the response.
   response.write(fileContents);
   response.end();
};