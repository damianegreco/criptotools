var path = require('path');
var fs = require("fs");
var crypto = require('crypto');
const { checkFile } = require('./funciones');

//desencriptar
const desencriptar = function(privateKeyDir, dumpDir, encriptadoDir, encriptadoFilename){
  return new Promise((resolve, reject) => {
    try {
      
      let desencriptadoFilename = encriptadoFilename.split(".");
      desencriptadoFilename.pop();
      desencriptadoFilename = desencriptadoFilename.join(".");
      // Obtiene clave privada
      const privateKeyRuta = path.join(privateKeyDir, ".privateKey");
      if (!checkFile(privateKeyRuta)) return reject("No existe clave privada");
      const privateKey = fs.readFileSync(privateKeyRuta);
      
      // Obtiene archivo encriptado 
      const archivoEncriptadoRuta = path.join(encriptadoDir, encriptadoFilename);
      if (!checkFile(archivoEncriptadoRuta)) return reject("No existe archivo encriptado");
      const archivoEncriptado = fs.readFileSync(archivoEncriptadoRuta);

      const encriptado = {
        // Los primeros 256 bytes corresponden a la clave AES encriptada (2048 bits / 8 bits por byte)
        AESKey: archivoEncriptado.subarray(0, 256),
        // Los siguientes 256 bytes corresponden al IV encriptado
        IV: archivoEncriptado.subarray(256, 512),
        // El resto es el archivo encriptado
        fileData: archivoEncriptado.subarray(512),
      }

      // Desencriptar la clave AES y el IV
      const aes = {
        key: crypto.privateDecrypt(privateKey, encriptado.AESKey),
        IV: crypto.privateDecrypt(privateKey, encriptado.IV)
      }
      
      //Crea el desencriptador
      const decipher = crypto.createDecipheriv('aes-256-cbc', aes.key, aes.IV);
      
      //Desencripta el archivo solicitado
      let decryptedFileData = decipher.update(encriptado.fileData);
      decryptedFileData = Buffer.concat([decryptedFileData, decipher.final()]);

      // Guardar el archivo desencriptado
      const archivoDesencriptado = path.join(dumpDir, `dec_${desencriptadoFilename}`)
      fs.writeFileSync(archivoDesencriptado, decryptedFileData);
  
      resolve()
    } catch (error) {
      if (error.code === "ERR_OSSL_RSA_OAEP_DECODING_ERROR") return reject("Clave privada incorrecta");
      reject(error);
    }
  })
}

module.exports = { desencriptar }