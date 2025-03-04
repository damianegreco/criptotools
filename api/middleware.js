const fsProm = require('fs/promises');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

/* Establece el directorio donde se almacenan las claves publicas */
const keysExternasDir = path.join(__dirname, '..', 'externos');

/* Obtiene el listado de todas las claves publicas para verificar el firmante */
function obtenerPublicKeys(){
  return new Promise((resolve, reject) => {
    fsProm.readdir(keysExternasDir, { withFileTypes: true })        // Lee todo el directorio
    .then((publicKeys) => {
      publicKeys = publicKeys.filter((file) => !file.isDirectory()) // Filtra que no haya directorios
      .filter((file) => file.name.includes('publicKey.pub'));       // Filtra que tenga la extension asignada a la claves publicas
      resolve(publicKeys);
    })
    .catch((error) => reject(error));
  })
}

function validarToken(token = null){
  return new Promise((resolve, reject) => {
    /* Si no hay token, no hay nada que validar */
    if (!token) return reject("SIN TOKEN");

    /* Busca las claves publicas que existan */
    obtenerPublicKeys()
    .then((publicKeys) => {
      /* Recorre todo el listado de claves publicas */
      for (let i = 0; i < publicKeys.length; i++) {
        /* Establece la ruta absoluta a la clave */
        const keyPath = path.join(keysExternasDir, publicKeys[i].name);
        let cert = fs.readFileSync(keyPath);
        /* comprueba si es el firmante */
        jwt.verify(token, cert, function(error, decoded) {
          /* Si no hay error, el token es valido  */
          if (!error) return resolve();
          /* Si el error es que esta expirado, no hay que seguir comprobando */
          if (error.name === "TokenExpiredError") return reject("Token expirado");
        });
      }
      return reject("TOKEN INVALIDO")
    })
    .catch((error) => reject(error));
  })
}

/* Extrae el token y comprueba la firma contra las claves publicas almacenadas */
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