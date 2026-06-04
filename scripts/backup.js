const path = require('path');
const { obtenerDatosConf, getFechaHoy } = require('../funciones/funciones');
const { realizarDump } = require('../funciones/backup');
const { ProgresoBackup } = require('../funciones/progreso');

const dumpDir = path.join(__dirname, "..", "dumps");
const publicKeyFile = path.join(dumpDir, 'publicKey.pub');
const datosJSON = obtenerDatosConf('conexion_db.conf.json');
const backupJSON = obtenerDatosConf('backup.conf.json');

const progreso = new ProgresoBackup();
progreso.encabezado(getFechaHoy().toString());

realizarDump(dumpDir, publicKeyFile, {
  ...datosJSON,
  DUMP_DIR: backupJSON.directorio_destino
}, progreso)
.then(({ nombreArchivoEnc, cronometro }) => {
  // resumen ya impreso por progreso.resumen()
})
.catch((error) => {
  if (error === 'RUTA_CLAVE_PRIVADA') return console.error("\n✗ No existe clave pública en dumps/publicKey.pub\n  Ejecutá: npm run generar-par");
  console.error('\n✗ Error en backup:', error);
  process.exit(1);
});
