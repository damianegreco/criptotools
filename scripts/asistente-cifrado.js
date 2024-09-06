var path = require('path');
var fs = require('fs');
const { obtenerDatosConf } = require('../funciones/funciones');

let backupJSON = obtenerDatosConf('backup.conf.json');
// require('dotenv').config({ path: path.join(__dirname, '..' , '.env') });
// const { DUMP_DIR } = process.env;

const { input, select, Separator } = require('@inquirer/prompts');
const { generarParClaves, comprimir, encriptar, desencriptar } = require('../funciones/main');

const consultaGenerarPar = async function(){
  try {
    const dirPublica = await input({ message: 'Directorio donde guardar clave pública: ', default: './dumps' });
    const dirPrivada = await input({ message: 'Directorio donde guardar clave pública: ', default: '~/' });
    
    generarParClaves(dirPublica, dirPrivada)
    .then(() => {
      console.log("Par de claves creado");
    })
    .catch((error) => {
      if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No ingresó ruta para clave privada \nnpm run generarpar [RUTA_CLAVE_PRIVADA]");
      if (error?.name === "ExitPromptError") return;
      console.error(error);
    }) 
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}

const consultaCifrar = async function(){
  try {
    const file = await input({ message: 'Ruta de archivo a encriptar: ' });
    
    const dumpDir = path.join(__dirname, 'dumps','publicKey.pub')
    const publicKeyFile = await input({ message: 'Ruta de clave pública: ', default: dumpDir });
  
    let dump_dir = await input({ message: 'Destino de archivo cifrado: ', default: backupJSON.directorio_destino });
    
    let cronometro = new Date();

    encriptar(file, publicKeyFile, dump_dir)
    .then((nombreArchivoEnc) => {
      cronometro = (new Date() - cronometro)
      console.log(`Se finalizó archivo: ${nombreArchivoEnc} en ${cronometro} ms`);
    })
    .catch((error) => {
      if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No existe clave publica \nnpm run generarpar [RUTA_CLAVE_PRIVADA]");
      console.error(error);
    })
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}


const consultaCifrarDir = async function(){
  try {
    const directorio = await input({ message: 'Ruta del directorio a encriptar: ' });
    const nombreDirectorio = directorio.split(path.sep).pop();
    
    const dumpDir = path.join(__dirname, 'dumps')
    const publicKeyFile = await input({ message: 'Ruta de clave pública: ', default: path.join(dumpDir,'publicKey.pub') });
    
    let destinoDir = await input({ message: 'Destino de archivo cifrado: ', default: backupJSON.directorio_destino });
    
    let cronometro = new Date();

    comprimir(dumpDir, directorio, nombreDirectorio)
    .then((comprimido) => {
      const comprimidoRuta = path.join(dumpDir, comprimido)
      
      encriptar(comprimidoRuta, publicKeyFile, destinoDir)
      .then((nombreArchivoEnc) => {

        fs.unlinkSync(comprimidoRuta);

        cronometro = (new Date() - cronometro)
        console.log(`Se finalizó archivo: ${nombreArchivoEnc} en ${cronometro} ms`);
      })
    })
    .catch((error) => {
      if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No existe clave publica \nnpm run generarpar [RUTA_CLAVE_PRIVADA]");
      console.error(error);
    })
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}

const consultaComprimir = async function(){
  try {
    const directorio = await input({ message: 'Ruta del directorio a comprimir: ' });
    const nombreDirectorio = directorio.split(path.sep).pop();

    let destinoDir = await input({ message: 'Destino de archivo comprimido: ', default: backupJSON.directorio_destino });
    
    let cronometro = new Date();

    comprimir(destinoDir, directorio, nombreDirectorio)
    .then((comprimido) => {
      console.log(`Se finalizó archivo: ${comprimido} en ${cronometro} ms`);
    })
    .catch((error) => {
      console.error(error);
    })
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}

const consultaDescifrar = async function(){
  try {
    
    let origenDir = await input({ message: 'Directorio de archivo cifrado: ', default: backupJSON.directorio_destino });

    const file = await input({ message: 'Nombre del archivo a desencriptar: ' });

    const destinoDirDefault = path.join(__dirname, 'dumps')
    let destinoDir = await input({ message: 'Destino de descifrado: ', default: destinoDirDefault });
    
    const privateKeyFile = await input({ message: 'Ruta de clave privada: ', default: '~/' });    
    
    let cronometro = new Date();

    desencriptar(privateKeyFile, destinoDir, origenDir, file)
    .then((nombreArchivoEnc) => {
      cronometro = (new Date() - cronometro)
      console.log(`Se finalizó archivo: ${nombreArchivoEnc} en ${cronometro} ms`);
    })
    .catch((error) => {
      if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No existe clave publica \nnpm run generarpar [RUTA_CLAVE_PRIVADA]");
      console.error(error);
    })
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}

const consultaIncial = function(){
  select({
    message: 'Seleccione acción a ejecutar',
    choices: [
      {
        name: 'Crear par de claves',
        value: 'generarpar',
        description: 'Para poder realizar backups, se debe generar el par de claves'
      },
      {
        name: 'Cifrar un archivo',
        value: 'cifrar',
        description: 'Cifrar un archivo usando clave pública'
      },
      {
        name: 'Comprimir un directorio',
        value: 'comprimir',
        description: 'Comprimir sin cifrar un directorio en .ZIP'
      },
      {
        name: 'Comprimir y cifrar un directorio',
        value: 'cifrardirectorio',
        description: 'Comprimir un directorio y cifrarlo usando clave pública'
      },
      {
        name: 'Descifrar un archivo',
        value: 'descifrar',
        description: 'Descrifrar un archivo usando clave privada'
      },
      new Separator()
    ]
  })
  .then((resp) => {
    const menu = {
      'generarpar': () => consultaGenerarPar(),
      'comprimir': () => consultaComprimir(),
      'cifrar': () => consultaCifrar(),
      'descifrar': () => consultaDescifrar(),
      'cifrardirectorio': () => consultaCifrarDir()
    }
    menu[resp]();
  })
  .catch((error) => {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  })
}

consultaIncial();