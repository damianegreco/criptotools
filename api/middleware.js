const fsProm = require('fs/promises');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const keysExternasDir = path.join(__dirname, '..', 'externos');

function obtenerPublicKeys(){
  return new Promise((resolve, reject) => {
    fsProm.readdir(keysExternasDir, { withFileTypes: true })
    .then((publicKeys) => {
      publicKeys = publicKeys.filter((file) => !file.isDirectory())
      .filter((file) => file.name.includes('publicKey.pub'));
      resolve(publicKeys);
    })
    .catch((error) => reject(error));
  })
}

function validarToken(token = null){
  return new Promise((resolve, reject) => {
    if (!token) return reject("SIN TOKEN");

    obtenerPublicKeys()
    .then((publicKeys) => {
      for (let i = 0; i < publicKeys.length; i++) {
        const keyPath = path.join(keysExternasDir, publicKeys[i].name);
        let cert = fs.readFileSync(keyPath);
        jwt.verify(token, cert, function(error, decoded) {
          if (error) return reject(error);
          console.log(decoded);
          return resolve()
        });
      }
      return reject("TOKEN INVALIDO")
    })
    .catch((error) => reject(error));
  })
}

function middleware(){
  return function(req, res, next){
    const token = req.headers.authorization;

    validarToken(token)
    .then(() => next())
    .catch((error) => {
      console.error(error);
      res.status(500).send("Ocurrió un error");
    });
  }
}

module.exports = { middleware }