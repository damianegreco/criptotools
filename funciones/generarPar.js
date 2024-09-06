const { generateKeyPair } = require('crypto');
const fs = require("fs");
const path = require("path");
const { checkArgs } = require('./funciones');

const checkPermisos = function(rutas = []){
return new Promise((resolve, reject) => {
  try {
    for (let i  = 0; i < rutas.length; i++) {
      if (fs.existsSync(rutas[i])) throw ({code:"EEXIST"})
    }
    resolve();
  } catch (error) {
    reject(error)
  }
  })
}

const abortar = function(rutas = []){
  for (let i = 0; i < rutas.length; i++) {
    if(fs.existsSync(rutas[i])) fs.unlinkSync(rutas[i]);
  }
}

const generarPar = function(dumpDir, ruta){
  return new Promise((resolve, reject) => {
    generateKeyPair('rsa', {
      modulusLength: 1024*2,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    }, async (error, publicKey, privateKey) => {
      if (error) return reject(error);
      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);
      const publicFile = path.join(dumpDir, "publicKey.pub");
      const privateFile = path.join(ruta, ".privateKey");
      try {
        await checkPermisos([publicFile, privateFile])
        // guardar publico
        fs.writeFileSync(publicFile, publicKey, { flag: "wx" });
        // guardar privado
        fs.writeFileSync(privateFile, privateKey, { flag: "wx" });
        
        resolve();
      } catch (error) {
        //No debe reemplazar si ya exisite
        if (error.code === "EEXIST") return reject("Ya existe clave pública/privada")
        //Si no tenia permisos para guardar la privada, elimina la pública
        if (error.code === "EACCES") {
          abortar([publicFile, privateFile])
          return reject("Permiso denegado en el directorio")
        }
        reject(error);
      }
    });
  })
}

const generarParClaves = function(dumpDir, rutaClavePrivada){
  return new Promise((resolve, reject) => {
    //Debe haber ingresado si o si ruta para clave privada
    if (checkArgs([rutaClavePrivada])) {
      generarPar(dumpDir, rutaClavePrivada)
      .then(() => resolve())
      .catch((error) => reject(error))
    } else {
      reject('RUTA_CLAVE_PRIVADA')
    }
  })
}

module.exports = { generarParClaves }