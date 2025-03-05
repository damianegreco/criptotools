const path = require('path');
const { generarLink } = require('../funciones/generarLink');
const { api_port } = require('../package.json');

/* Asigna puerto del package.json, pero si no lo hay establece por defecto 3001 */
const puerto = api_port ?? 3001;
/*
  Comando:
    npm run generar-link [RUTA_ARCHIVO]
    Ej:
      npm run generar-link /ruta/al/archivo     <- ruta absoluta del archivo a descargar
*/

const RUTA_ARCHIVO = process.argv[2] //ruta del archivo a linkear

if (!RUTA_ARCHIVO || RUTA_ARCHIVO === "") {
  console.error("Sin ruta a archivo");
  return process.exit(1);
}
const rutaCompleta = `http://localhost:${puerto}/descargar`
/* Generar un link de unico uso */
generarLink(RUTA_ARCHIVO)
.then((ruta) => {
  console.log(`Ruta de descarga del archivo: \n${rutaCompleta}/${ruta}`);
})
.catch((error) => {
  console.error(error);
  return process.exit(1);
})