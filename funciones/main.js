const { checkFile, checkArgs, getFechaHoy } = require('./funciones');

const { comprimir, encriptar } = require('./encriptar');
const { desencriptar } = require('./desencriptar');

const { generarParClaves } = require('./generarPar');
const { realizarDump } = require('./backup');
const { desencriptarArchivo } = require('./restore');

module.exports = { 
  checkFile, checkArgs, getFechaHoy,
  comprimir, encriptar, desencriptar,
  generarParClaves,
  realizarDump,
  desencriptarArchivo
}