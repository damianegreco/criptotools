const fs = require('fs');
const path = require('path');
const { obtenerDatosConf } = require('../funciones/funciones');

// require('dotenv').config({ path: path.join(__dirname, '..' , '.env') });
// const { DUMP_PASS, DUMP_USER, DUMP_DIR, DBHOST, DBPORT } = process.env;



const { input, select, Separator } = require('@inquirer/prompts');
const { getFechaHoy, generarParClaves, realizarDump, desencriptarArchivo } = require('../funciones/main');

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

const consultaRealizarDump = async function(){
  try {
    let datosJSON = obtenerDatosConf('conexion_db.conf.json');
    let backupJSON = obtenerDatosConf('backup.conf.json');
    const dumpDir = path.join(__dirname, '..', 'dumps')
    const publicKeyFile = await input({ message: 'Ruta de clave pública: ', default: './dumps/publicKey.pub' });
  
    let dump_host = await input({ message: 'Host de BD: ', default: 'conf' });
    if (dump_host === "conf") dump_host = datosJSON.host;
    let dump_port = await input({ message: 'Host de BD: ', default: 'conf' });
    if (dump_port === "conf") dump_port = datosJSON.port;
    let dump_user = await input({ message: 'Usuario de BD: ', default: 'conf' });
    if (dump_user === "conf") dump_user = datosJSON.user;
    let dump_pass = await input({ message: 'Clave de BD: ', default: 'conf' });
    if (dump_pass === "conf") dump_pass = datosJSON.pass;
  
    let dump_dir = await input({ message: 'Destino de backup: ', default: 'conf' });
    if (dump_dir === "conf") dump_dir = backupJSON.directorio_destino;
    
    realizarDump(dumpDir, publicKeyFile, {
      DBHOST: dump_host, 
      DBPORT: dump_port, 
      DUMP_USER: dump_user, 
      DUMP_PASS: dump_pass, 
      DUMP_DIR: dump_dir
    })
    .then(({nombreArchivoEnc, cronometro}) => {
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

const consultaRestore = async function(){
  try {
    let backupJSON = obtenerDatosConf('backup.conf.json');

    const privateKeyDir = await input({ message: 'Ruta de clave privada: ', default: '~/' });
    const fechaArchivo = await input({ message: 'Fecha del archivo (AAAA-MM-DD): ', default: getFechaHoy() });
    
    let dump_dir = await input({ message: 'Directorio de backups: ', default: '.env' });
    if (dump_dir === ".env") dump_dir = backupJSON.directorio_destino;
    
    const dumpDirDefault = path.join(__dirname, "dumps");
    let dumpDir = await input({ message: 'Directorio donde guardar clave pública: ', default: dumpDirDefault});
  
    desencriptarArchivo(privateKeyDir, dumpDir, backupJSON.directorio_destino, fechaArchivo)
    .then(({cronometro}) => {
      console.log(`Se finalizó en ${cronometro} ms`);
    })
    .catch((error) => {
      if (error === 'argumentos') return console.error("Faltan argumentos \nnpm run restore [RUTA_ARCHIVO_CLAVE_PRIVADA] [FECHA_ARCHIVO_CIFRADO]");
      if (error?.name === "ExitPromptError") return;
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
        name: 'Realizar backup',
        value: 'dump',
        description: 'Generar manualmente un dump completo'
      },
      {
        name: 'Desencriptar un backup',
        value: 'restore',
        description: 'Desencriptar un backup generado anteriormente'
      },
      new Separator()
    ]
  })
  .then((resp) => {
    const menu = {
      'generarpar': () => consultaGenerarPar(),
      'dump': () => consultaRealizarDump(),
      'restore': () => consultaRestore()
    }
    menu[resp]();
  })
  .catch((error) => {
    if (error?.name === "ExitPromptError") return;
    console.error(JSON.stringify(error));
  })
}

consultaIncial();