var path = require('path');
const { obtenerDatosConf } = require('../funciones/funciones');
const { realizarDump } = require('../funciones/backup');

const dumpDir = path.join(__dirname, "..","dumps");

const publicKeyFile = path.join(dumpDir, 'publicKey.pub');
let datosJSON = obtenerDatosConf('conexion_db.conf.json');
let backupJSON = obtenerDatosConf('backup.conf.json');

realizarDump(dumpDir, publicKeyFile, {
  ...datosJSON,
  DUMP_DIR: backupJSON.directorio_destino
})
.then(({nombreArchivoEnc, cronometro}) => {
  console.log(`Se finalizó archivo: ${nombreArchivoEnc} en ${cronometro} ms`);
})
.catch((error) => {
  if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No existe clave publica \nnpm run generarpar [RUTA_CLAVE_PRIVADA]");
  console.error(error);
})