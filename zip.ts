const fs = require('fs');
const archiver = require('archiver');

const output = fs.createWriteStream('project.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
  console.log(`Zipped: ${archive.pointer()} bytes`);
});

archive.pipe(output);
archive.directory('.', false);
archive.finalize();
