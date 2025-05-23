const path = require('path');
const { generarParClaves } = require('../funciones/generarPar');

const externosDir = path.join(__dirname, "..", "externos");

/*
  Comando:
    npm run generar-par-externo
*/

function formatDate(date) {
  let d = new Date(date);
  let year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  let hour = '' + d.getHours();
  let mins = '' + d.getMinutes();
  let secs = '' + d.getSeconds();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  if (hour.length < 2) hour = '0' + hour;
  if (mins.length < 2) mins = '0' + mins;
  if (secs.length < 2) secs = '0' + secs;

  const nombre = `${year}-${month}-${day}_${hour}-${mins}-${secs}_`
  return nombre;
}

const nombre = formatDate(new Date())

generarParClaves(externosDir, externosDir, nombre, true)
.then(() => {
  console.log("Par de claves creado");
})
.catch((error) => {
  console.error(error);
  process.exit(1);
})
