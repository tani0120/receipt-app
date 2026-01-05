import http from 'http';

const port = process.env.PORT || 8080;

console.log(`Attempting to start server on 0.0.0.0:${port}`);

const server = http.createServer((req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello Cloud Run from Pure Node!');
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);
});

// Capture signals for graceful shutdown (good practice for containers)
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
