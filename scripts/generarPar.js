var path = require('path');
const { generarParClaves } = require('../funciones/generarPar');

const dumpDir = path.join(__dirname, "..", "dumps");

const RUTA_CLAVE_PRIVADA = process.argv[2] //ruta donde guardar clave privada

/*
  Comando:
    npm run generarpar [RUTA_CLAVE_PRIVADA]
    Ej:
      npm run generarpar ./          <- Genera el certificado en la raiz del proyecto
      npm run generarpar ~/          <- Genera el certificado en la raiz de la carpeta personal
*/

generarParClaves(dumpDir, RUTA_CLAVE_PRIVADA)
.then(() => {
  console.log("Par de claves creado");
})
.catch((error) => {
  if (error === 'RUTA_CLAVE_PRIVADA') 
    return console.error("No ingresó ruta para clave privada \nnpm run generarpar [RUTA_CLAVE_PRIVADA]");
  console.error(error);
})
