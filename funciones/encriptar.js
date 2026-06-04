var crypto = require('crypto');
var path = require('path');
var fs = require("fs");
const { ZipArchive } = require('archiver');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

const comprimir = function(dumpDir, carpeta, nombre, progress = null){
  return new Promise((resolve, reject) => {
    try {
      const nombreComprimido = `${nombre}.zip`;

      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, {recursive:true});
      const output = fs.createWriteStream(path.join(dumpDir, nombreComprimido));
      const archive = new ZipArchive({ zlib: { level: 9 } });
      archive.pipe(output)

      if (progress !== null){
        archive.on("progress", progress);
      }

      output.on('close', () => resolve(nombreComprimido));
      archive.on('error', (error) => reject(error));

      archive.directory(carpeta, false);
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  })
}

const encriptar = function(comprimido, publicKeyFilename, dumpDir, onProgress = null){
  return new Promise(async (resolve, reject) => {
    try {
      const publicKey = fs.readFileSync(publicKeyFilename, "utf8");

      const aesKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      const encryptedAESKey = crypto.publicEncrypt(publicKey, aesKey);
      const encryptedIV = crypto.publicEncrypt(publicKey, iv);

      const nombreArchivo = path.basename(comprimido);
      const archivoEncriptado = path.join(dumpDir, `${nombreArchivo}.enc`);

      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });

      const inputStream = fs.createReadStream(comprimido);
      const outputStream = fs.createWriteStream(archivoEncriptado);

      outputStream.write(encryptedAESKey);
      outputStream.write(encryptedIV);

      const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);

      if (onProgress) {
        let bytesProcessed = 0;
        const contador = new Transform({
          transform(chunk, encoding, callback) {
            bytesProcessed += chunk.length;
            onProgress(bytesProcessed);
            callback(null, chunk);
          }
        });
        await pipelineAsync(inputStream, contador, cipher, outputStream);
      } else {
        await pipelineAsync(inputStream, cipher, outputStream);
      }

      resolve(`${nombreArchivo}.enc`);
    } catch (error) {
      reject(error);
    }
  });

}

module.exports = { comprimir, encriptar }
