
# Herramientas de cifrado y backup

Paquete de herramientas para realizar cifrado, descifrado y backup de bases de datos y archivos.


## Software necesario

Para poder ejecutar los scripts de este proyecto, se debe tener instalado **Node.js** junto con **npm**. 

Se recomienda utilizar **nvm** para gestionar las versiones de Node.js, ya que permite cambiarlas e instalarlas facilmente, aunque no es necesario.

- [Node.js](https://nodejs.org/en/download/package-manager/current)
- [nvm](https://github.com/nvm-sh/nvm)

## Instalación

Al clonar el proyecto, se deben instalar las dependencias

```bash
  npm install
```

Después, se puede comenzar a utilizar el scripts *asistente-cifrado*, pero no las herramientas de backup.

Para utilizar el resto de los comandos desatendos, para por ejemplo automatizar a traves de crontab los backups, se debe establecer las variables necesarias.

Esto puede hacerse de forma manual completando los archivos *.conf.json* del directorio *conf*, o puede hacerse a través del script *inicializacion*.


```bash
  npm run inicializacion
```

Este script a través de pasos guiados, solicita la infomación necesaria para realizar y restaurar los backups.

## Scripts

-  **Inicializar**

Script para inicializar los archivos de configuración necesarios para los scripts de backup. A través del asistente se solicita la información necesaria para los archivos de configuración.

```bash
  npm run inicializar
```

- **Asistente de cifrado**

Permite de forma asistida realizar las siguientes tareas relacionadas con el cifrado de archivos y directorios: ***Crear par de claves*** ***Cifrar un archivo***, ***Comprimir un directorio***, ***Comprimir y cifrar un directorio***, ***Descifrar un archivo***

```bash
  npm run asistente-cifrado
```

- **Generar par de claves**

Genera el par de claves necesario para el cifrado. La clave *publicKey.pub* será utilizada para encriptar los archivos/directorios y la clave *.privateKey* será la debe ser resguardada y la única a través de la cúal se podrá desencriptar los resultados de los demás scripts.

```bash
  npm run generarpar [RUTA_CLAVE_PRIVADA]
```

- **Asistente de backup**

Permite realizar de forma asistida las siguientes tareas relacionadas con los backups: ***Crear par de claves***, ***Realizar backup*** y ***Desencriptar un backup***. 

```bash
  npm run asistente-backup
```

*Requiere los archivos de configuración para Realizar backup y Desencriptar un backup.*

- **Realizar backup**

Ejecuta el las funciones para realizar los dumps de las bases de datos, copiado de archivos, comprimido y cifrado.


```bash
  npm run backup
```

*Requiere los archivos de configuración y la clave pública.*

- **Restaurar**

Ejecuta el desenciptado de un archivo de backup. 


```bash
  npm run restore [RUTA_ARCHIVO_CLAVE_PRIVADA] [FECHA_ARCHIVO_CIFRADO]
```
*Require de los archivos de configuración y la clave privada.*

## Aclaraciones

Las herramientas relacionadas al cifrado utilizan el protocolo de cifrado par de claves asimetricas **RSA**, por el cuál se genera una clave pública y una privada.

La clave pública será necesaria para poder realizar los encriptados y no hay riesgo dejarla dentro del proyecto, exponerla o publicarla. Esta clave solo puede cifrar, nunca descifrar.

También se utiliza el protocolo de cifrado de clave simetrica **AES** en conjunto con la clave pública del par RSA. Esta clave simetrica se genera aleatoriamente para cada encriptado, nunca se publica y forma parte del archivo encriptado. 

La clave privada del par RSA **SE DEBE RESGUARDAR CON TOTAL SEGURIDAD**. Sin clave privada no se puede volver a descifrar ninguno de los archivos cifrados con su par pública.
## Desarrollo
### Ministerio de Bienestar Ciudadano y Justicia
### Gobierno de la provincia de Tierra del Fuego A.e.I.A.S. 

 - Director Provincial de Sistemas y Análisis Estadísticos

**Greco, Damián E.**

 - Coordinador Provincial de Gestión de Sistemas

**Salguero, Nicolas**