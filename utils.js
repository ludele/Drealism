function statusCodeResponse(response, code, value, type) {
   response.writeHead(code, { 'Content-Type': `${type}` });
   response.write(value);
   response.end();
}

async function getBody(request) {
  return new Promise(async function (resolve, reject) {
      let chunks = [];

      request.on("data", function (chunk) {
          chunks.push(chunk);
      });

      request.on("error", function (err) {
          reject(err);
      });

      request.on("end", function () {
          try {
              let data = Buffer.concat(chunks).toString();
              resolve(data);
          } catch (error) {
              reject(error);
          }
      });
  });

}

module.exports = {
   statusCodeResponse,
   getBody
 };