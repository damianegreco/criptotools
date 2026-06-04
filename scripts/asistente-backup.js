const fs = require('fs');
const path = require('path');
const os = require('os');
const { obtenerDatosConf, getFechaHoy } = require('../funciones/funciones');
const { input, select, Separator } = require('@inquirer/prompts');
const { generarParClaves, realizarDump, desencriptarArchivo } = require('../funciones/main');
const { ProgresoBackup } = require('../funciones/progreso');

const expandHome = (p) => (p && p.startsWith('~/')) ? path.join(os.homedir(), p.slice(2)) : p;

const consultaGenerarPar = async function(){
  try {
    const dirPublica = await input({ message: 'Directorio donde guardar clave pública: ', default: './dumps' });
    const dirPrivada = await input({ message: 'Directorio donde guardar clave privada: ', default: os.homedir() });

    generarParClaves(expandHome(dirPublica), expandHome(dirPrivada))
    .then(() => {
      console.log("Par de claves creado");
    })
    .catch((error) => {
      if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No ingresó ruta para clave privada");
      if (error?.name === "ExitPromptError") return;
      console.error(error);
    });
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}

const consultaRealizarDump = async function(){
  try {
    let datosJSON = obtenerDatosConf('conexion_db.conf.json');
    let backupJSON = obtenerDatosConf('backup.conf.json');
    const dumpDir = path.join(__dirname, '..', 'dumps');
    const publicKeyFile = await input({ message: 'Ruta de clave pública: ', default: './dumps/publicKey.pub' });

    let dump_host = await input({ message: 'Host de BD: ', default: 'conf' });
    if (dump_host === "conf") dump_host = datosJSON.host;
    let dump_port = await input({ message: 'Puerto de BD: ', default: 'conf' });
    if (dump_port === "conf") dump_port = datosJSON.port;
    let dump_user = await input({ message: 'Usuario de BD: ', default: 'conf' });
    if (dump_user === "conf") dump_user = datosJSON.user;
    let dump_pass = await input({ message: 'Clave de BD: ', default: 'conf' });
    if (dump_pass === "conf") dump_pass = datosJSON.pass;

    let dump_dir = await input({ message: 'Directorio destino de backup: ', default: 'conf' });
    if (dump_dir === "conf") dump_dir = backupJSON.directorio_destino;

    const progreso = new ProgresoBackup();
    progreso.encabezado(getFechaHoy().toString());

    realizarDump(dumpDir, expandHome(publicKeyFile), {
      ...datosJSON,
      DBHOST: dump_host,
      DBPORT: dump_port,
      DUMP_USER: dump_user,
      DUMP_PASS: dump_pass,
      DUMP_DIR: expandHome(dump_dir)
    }, progreso)
    .then(() => {
      // resumen ya impreso por progreso
    })
    .catch((error) => {
      if (error === 'RUTA_CLAVE_PRIVADA') return console.error("No existe clave pública\n  Ejecutá: npm run generar-par");
      if (error?.name === "ExitPromptError") return;
      console.error(error);
    });
  } catch (error) {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  }
}

const consultaRestore = async function(){
  try {
    let backupJSON = obtenerDatosConf('backup.conf.json');

    const privateKeyDir = await input({ message: 'Directorio de clave privada: ', default: os.homedir() });
    const fechaArchivo = await input({ message: 'Fecha del archivo (AAAA-MM-DD): ', default: getFechaHoy().toString() });

    let dump_dir = await input({ message: 'Directorio de backups: ', default: 'conf' });
    if (dump_dir === "conf") dump_dir = backupJSON.directorio_destino;

    const dumpDirDefault = path.join(__dirname, '..', 'dumps');
    let dumpDir = await input({ message: 'Directorio destino (desencriptado): ', default: dumpDirDefault });

    desencriptarArchivo(expandHome(privateKeyDir), expandHome(dumpDir), backupJSON.directorio_destino, fechaArchivo)
    .then(({ cronometro }) => {
      console.log(`Archivo desencriptado en ${cronometro}ms`);
    })
    .catch((error) => {
      if (error === 'argumentos') return console.error("Faltan argumentos");
      if (error?.name === "ExitPromptError") return;
      console.error(error);
    });
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
  });
}

consultaIncial();
