const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');
const { obtenerDatosConf } = require('./funciones');

let mailJSON = obtenerDatosConf('mail.conf.json');

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: mailJSON.user,
    pass: mailJSON.pass,
  },
});

const getFecha = function(){
  let fecha = "";
  const now = new Date();
  let dia = now.getDate();
  if (dia < 10) dia = "0" + dia;
  let mes = now.getMonth() + 1;
  if (mes < 10) mes = "0" + mes;
  let anio = now.getFullYear();
  let hora = now.getHours();
  if (hora < 10) hora = "0" + hora;
  let mins = now.getMinutes();
  if (mins < 10) mins = "0" + mins;
  fecha = "" + dia + "/" + mes + "/" + anio + " " + hora + ":" + mins;
  return(fecha);
}

const generarHTML = function(dbs = [], archivos = [], nombre = ""){
  let html = fs.readFileSync(path.join(__dirname, 'modelo', 'mailBackup.html'), 'utf8')
  html = html.replace('#DBS#', dbs.join(", "));
  html = html.replace('#ARCHIVOS#', archivos.map((arc) => `${arc.nombre} (${arc.ruta})`).join(", <br>"));
  html = html.replace('#NOMBRE#', nombre);
  html = html.replace('#FECHA#', getFecha());
  return html;
}

function enviarMail(dbs, archivos, nombre) {
  // send mail with defined transport object
  transporter.sendMail({
    from: `"${mailJSON.enviaNombre}" <${mailJSON.user}>`, 
    to: mailJSON.destMail, 
    subject: "Backup realizado", 
    text: "Se realizó el backup de las bases de datos y/o archivos", 
    html: generarHTML(dbs, archivos, nombre), 
  }, function(error, info) {
    if (error) { 
      console.error(error);
      return;
    }
    console.log(`Mail enviado: ${info.messageId}`);
    
  });

  //console.log("Message sent: %s", info.messageId);
}

module.exports = { enviarMail }