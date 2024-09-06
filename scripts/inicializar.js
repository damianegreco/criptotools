const { input, select, password, Separator } = require('@inquirer/prompts');
const { escribirArchivo } = require('../funciones/funciones');

/**
 * menú de que archivo editar
 * 1. conexion de db 
 * 2. datos de backup
 * 3. salir
 * 
 * 1. a. pedir host de la db
 * 1. b. pedir port de la db
 * 1. c. pedir user de la db
 * 1. d. pedir pass de la db
 * vuelve a menú principal
 * 
 * 2. a. agregar base de datos (input y vuelve a menú 2)
 * 2. b. agregar directorio de archivos (input y vuelve a menú 2)
 * 2. c. volver a menú principal
 * 2. d. salir
 */

const consultaConexion = async function(){
  const motordb = await select({
    message: 'Seleccione motor de base de datos',
    choices: [
      { name: 'PostgreSQL', value: 'postgres' },
      { name: 'MySQL/MariaDB', value: 'mysql' }
    ]
  });
  const host = await input({ message: 'IP o dominio de la DB: ' });
  const port = await input({ message: 'Puerto de la DB: ' });
  const user = await input({ message: 'Usuario de la DB: ' });
  const pass = await password({ message: 'Contraseña de la DB: ', mask:"*" });
  const datos = { motordb, host, port, user, pass };
  
  await escribirArchivo("conexion_db.conf.json", datos)
}

const consultaBackup = async function(){
  let datos = {
    directorio_destino: "",
    dbs: [],
    archivos: []
  }
  function consulta(){
    select({
      message: 'Seleccione acción a ejecutar',
      choices: [
        {
          name: 'Registrar directorio de backup',
          value: 'dest',
          description: 'Registrar el directorio donde guardar los backups'
        },
        {
          name: 'Registrar base de datos',
          value: 'db',
          description: 'Agregar base de datos a la lista de backup'
        },
        {
          name: 'Registrar directorio de archivos',
          value: 'dir',
          description: 'Agregar directorio a la lista de backup'
        },
        {
          name: 'Guardar y volver al menú principal',
          value: 'ret',
          description: 'Volver al menú principal del asistente'
        },
        {
          name: 'Guardar y salir',
          value: 'salir',
          description: 'Salir del asistente'
        },
        new Separator()
      ]
    })
    .then((resp) => {
      const menu = {
        'dest': async () => {
          const destino = await input({ message: 'Ruta absoluta de del directorio donde respaldar: ' });
          datos.directorio_destino = destino;
          consulta();
        },
        'db': async () => {
          const nuevaDB = await input({ message: 'Ruta absoluta de nuevo directorio a respaldar: ' });
          datos.dbs.push(nuevaDB);
          consulta();
        },
        'dir': async () => {
          const nuevoDirectorio = await input({ message: 'Ruta absoluta de nuevo directorio a respaldar: ' });
          datos.archivos.push(nuevoDirectorio);
          consulta();
        },
        'ret':() => {
          console.log(datos);
          escribirArchivo("backup.conf.json", datos);
          consultaIncial();
        },
        'salir':() => {
          console.log(datos);
          escribirArchivo("backup.conf.json", datos);
        }
      }
      menu[resp]();
    })
    .catch((error) => {
      if (error?.name === "ExitPromptError") return;
      console.error(error);
    })
  }
  consulta();
}


const consultaIncial = function(){
  select({
    message: 'Seleccione acción a ejecutar',
    choices: [
      {
        name: 'Guardar datos de conexión a DB',
        value: 'conexion',
        description: 'Solicita los datos para establecer la conexion de la base de datos'
      },
      {
        name: 'Guardar bases de datos y archivos',
        value: 'backup',
        description: 'Solicita bases de datos y directorios de archivos a respaldar'
      },
      {
        name: 'Salir',
        value: 'salir',
        description: 'Salir del asistente'
      },
      new Separator()
    ]
  })
  .then((resp) => {
    const menu = {
      'conexion': () => consultaConexion(),
      'backup': () => consultaBackup(),
      'salir':() => {}
    }
    menu[resp]();
  })
  .catch((error) => {
    if (error?.name === "ExitPromptError") return;
    console.error(error);
  })
}

consultaIncial();