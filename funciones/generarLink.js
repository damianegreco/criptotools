const crypto = require('crypto');
const db = require("../api/db/main")();
const fsProm = require('fs/promises');
const fs = require('fs');
const path = require('path');

function generarRuta(pathFile){
  return new Promise((resolve, reject) => {
    fsProm.readFile(pathFile)
    .then((file) => {
      const hash = crypto.createHash('md5').update(Buffer.from(file)).digest('hex');
      return resolve(hash)
    })
    .catch((error) => reject(error));
  })
}

function guardarLink(hash, pathFile){
  return new Promise((resolve, reject) => {
    const fileName = path.basename(pathFile)
    console.log(fileName);
    db.links.insertAsync({hash, pathFile, fileName, used:false, createdAt: new Date(), usedAt: null})
    .then((resp) => resolve(resp._id))
    .catch((error) => reject(error));
  })
}

function generarLink(pathFile){
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(pathFile)) reject("Archivo inexistente");
    const ruta = await generarRuta(pathFile);
    guardarLink(ruta, pathFile)
    .then(() => resolve(ruta))
    .catch((error) => {
      console.error(error);
      reject(error);
    })
  })
}

module.exports = { generarLink }