var crypto = require('crypto');
var path = require('path');
var fs = require("fs");
const archiver = require('archiver');

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
  return new Promise((resolve, reject) => {
    try {
      
      const publicKey = fs.readFileSync(publicKeyFilename, "utf8");
      let input = fs.readFileSync(comprimido);

      // Generar una clave simétrica random (AES)
      const aesKey = crypto.randomBytes(32);  // 256 bits
      const iv = crypto.randomBytes(16);  // Initial Vector para AES

      // Encriptar el archivo con la clave simétrica (AES)
      const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
      let encryptedFileData = cipher.update(input);
      encryptedFileData = Buffer.concat([encryptedFileData, cipher.final()]);

      // Encriptar la clave simétrica (AES) y el IV con la clave pública (RSA)
      const encryptedAESKey = crypto.publicEncrypt(publicKey, aesKey);
      const encryptedIV = crypto.publicEncrypt(publicKey, iv);

      // Concatenar el archivo encriptado, la clave AES encriptada y el IV encriptado
      const finalData = Buffer.concat([encryptedAESKey, encryptedIV, encryptedFileData]);
      
      // Escribe el archivo encriptado en la carpeta local
      const nombreArchivo = comprimido.split(path.sep).pop();
      
      const archivoEncriptado = path.join(dumpDir,`${nombreArchivo}.enc`);
      
      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, {recursive:true});
      fs.writeFileSync(archivoEncriptado, finalData, {encoding:'utf8',flag:'w'});
      
      console.log(`${nombreArchivo}.enc`);

      resolve(`${nombreArchivo}.enc`)
    } catch (error) {
      reject(error);
    }
  })
}

module.exports = { comprimir, encriptar }