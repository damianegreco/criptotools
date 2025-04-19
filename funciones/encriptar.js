var crypto = require('crypto');
var path = require('path');
var fs = require("fs");
const archiver = require('archiver');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

//comprimir
const comprimir = function(dumpDir, carpeta, nombre, progress = null){
  return new Promise((resolve, reject) => {
    try {
      const nombreComprimido = `${nombre}.zip`;

      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, {recursive:true});
      const output = fs.createWriteStream(path.join(dumpDir, nombreComprimido));
      // El zip en maxima compresión
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output)

      if (progress !== null){
        archive.on("progress", progress);
      }

      // Cuando termine, resuelve el nombre con el que se guarda
      output.on('close', () => resolve(nombreComprimido));
      archive.on('error', (error) => reject(error));

      // Agrega al comprimido la carpeta de dumps y archivos
      archive.directory(carpeta, false);
      // Cierra el zip
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  })
}

//encriptar
const encriptar = function(comprimido, publicKeyFilename, dumpDir){
  return new Promise(async (resolve, reject) => {
    try {
      // Cargar clave pública
      const publicKey = fs.readFileSync(publicKeyFilename, "utf8");

      // Generar una clave simétrica (AES)
      const aesKey = crypto.randomBytes(32);  // 256 bits para AES
      const iv = crypto.randomBytes(16);      // IV de 16 bytes para AES-CBC

      // Encriptar la clave AES y el IV con la clave pública (RSA)
      const encryptedAESKey = crypto.publicEncrypt(publicKey, aesKey);
      const encryptedIV = crypto.publicEncrypt(publicKey, iv);

      // Nombre del archivo y ruta de salida
      const nombreArchivo = path.basename(comprimido);
      const archivoEncriptado = path.join(dumpDir, `${nombreArchivo}.enc`);

      // Verificar si el directorio existe, si no, crearlo
      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });

      // Establecer flujos de lectura y escritura
      const inputStream = fs.createReadStream(comprimido);
      const outputStream = fs.createWriteStream(archivoEncriptado);

      // Escribir la clave AES y el IV encriptados antes del contenido encriptado
      outputStream.write(encryptedAESKey);
      outputStream.write(encryptedIV);

      // Crear el cifrador AES
      const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);

      // Procesar el archivo con el flujo de datos (streaming)
      await pipelineAsync(inputStream, cipher, outputStream);

      console.log(`${nombreArchivo}.enc`);
      resolve(`${nombreArchivo}.enc`);

    } catch (error) {
      reject(error);
    }
  });

}

module.exports = { comprimir, encriptar }