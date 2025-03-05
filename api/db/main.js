const Datastore = require('@seald-io/nedb');
const path = require('path');

const dbPath = path.join(__dirname,'data');

const db = {
  links: new Datastore({ filename: path.join(dbPath, 'links.db') })
}

function conectar(){
  try{
    db.links.loadDatabase()
    return db;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

module.exports = conectar;