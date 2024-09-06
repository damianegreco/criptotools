var path = require('path');
const { desencriptarArchivo } = require('../funciones/restore');
const { obtenerDatosConf } = require('../funciones/funciones');

const dumpDir = path.join(__dirname,"..","dumps");
let backupJSON = obtenerDatosConf('backup.conf.json');


/*
  comando:
    npm run restore [RUTA_ARCHIVO_CLAVE_PRIVADA] [FECHA_ARCHIVO_CIFRADO]
*/

const [,, PRIVATE_KEY_ROUTE, FECHA_ARCHIVO] = process.argv;
const backupDir = backupJSON.directorio_destino;

desencriptarArchivo(PRIVATE_KEY_ROUTE, dumpDir, backupDir, FECHA_ARCHIVO)
.then(({cronometro}) => {
  console.log(`Se finalizó en ${cronometro} ms`);
})
.catch((error) => {
  if (error === 'argumentos') return console.error("Faltan argumentos \nnpm run restore [RUTA_ARCHIVO_CLAVE_PRIVADA] [FECHA_ARCHIVO_CIFRADO]");
  console.error(error);
})