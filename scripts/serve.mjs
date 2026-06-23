import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const port = 8080;
const root = join(process.cwd(), "web-app");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

const filePathFor = url => {
  const requestedPath = new URL(url, `http://localhost:${port}`).pathname;
  const cleanPath = normalize(requestedPath === "/" ? "/index.html" : requestedPath);
  return join(root, cleanPath);
};

createServer((request, response) => {
  const filePath = filePathFor(request.url);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Jungle Chess web app running at http://localhost:${port}`);
});
