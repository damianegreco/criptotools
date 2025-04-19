var path = require('path');
var fs = require("fs");
var crypto = require('crypto');
const { checkFile } = require('./funciones');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

const desencriptar = function(privateKeyDir, dumpDir, encriptadoDir, encriptadoFilename) {
  return new Promise((resolve, reject) => {
    try {
      let desencriptadoFilename = encriptadoFilename.split(".");
      desencriptadoFilename.pop();
      desencriptadoFilename = desencriptadoFilename.join(".");

      const privateKeyRuta = path.join(privateKeyDir, ".privateKey");
      if (!checkFile(privateKeyRuta)) return reject("No existe clave privada");
      const privateKey = fs.readFileSync(privateKeyRuta);

      const archivoEncriptadoRuta = path.join(encriptadoDir, encriptadoFilename);
      if (!checkFile(archivoEncriptadoRuta)) return reject("No existe archivo encriptado");

      // Abrimos el archivo solo para leer los primeros 512 bytes
      const fd = fs.openSync(archivoEncriptadoRuta, 'r');
      const buffer = Buffer.alloc(512);
      fs.readSync(fd, buffer, 0, 512, 0);
      fs.closeSync(fd);

      const encriptado = {
        AESKey: buffer.subarray(0, 256),
        IV: buffer.subarray(256, 512),
      };

      const aes = {
        key: crypto.privateDecrypt(privateKey, encriptado.AESKey),
        IV: crypto.privateDecrypt(privateKey, encriptado.IV),
      };

      const decipher = crypto.createDecipheriv('aes-256-cbc', aes.key, aes.IV);

      const inputStream = fs.createReadStream(archivoEncriptadoRuta, { start: 512 });
      const outputStream = fs.createWriteStream(path.join(dumpDir, `dec_${desencriptadoFilename}`));

      pipelineAsync(
        inputStream,
        decipher,
        outputStream
      )
        .then(() => {
          console.log(`Archivo desencriptado correctamente: ${path.join(dumpDir, `dec_${desencriptadoFilename}`)}`);
          resolve();
        })
        .catch((err) => {
          return reject(`Error durante el desencriptado: ${err.message}`);
        });

    } catch (error) {
      if (error.code === "ERR_OSSL_RSA_OAEP_DECODING_ERROR") return reject("Clave privada incorrecta");
      reject(error);
    }
  });
}

module.exports = { desencriptar }