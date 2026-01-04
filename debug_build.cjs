
const { exec } = require('child_process');
const fs = require('fs');

console.log("Starting build debug...");
exec('npm run build-only', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const logContent = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error ? error.message : 'None'}`;
    fs.writeFileSync('build_debug.log', logContent);
    console.log("Build finished. Log written to build_debug.log");
});
