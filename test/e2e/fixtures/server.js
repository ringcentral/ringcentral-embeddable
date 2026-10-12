const { readFileSync } = require('fs');
const { createServer } = require('http');
const path = require('path');

const hostPage = readFileSync(path.join(__dirname, 'host.html'));

const server = createServer((request, response) => {
  if (request.url !== '/') {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(hostPage);
});

server.listen(8081, '127.0.0.1');
