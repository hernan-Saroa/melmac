# **Melmac V2 Backend - Manual**


## Requisitos para despliegue local:
- Instancia de Postgresql (12+) corriendo en el sistema
- Python 3 instalado (versión 3.7 > )
- Ambiente virtual (opcional, pero se recomienda su uso)

## Requisitos para despliegue en servidor:
- Instalación de librerias para desarrollo en postgresql (para debian y ubuntu correr el siguiente comando: ```apt-get install libpq-dev```)
- Nginx
- Librerias de Python gunicorn (despliegue sincronico y unicamente protocolo http) y daphne (despliegue asincronico para protocolo http y ws o websocket)
- Redis (para el mantenimiento de memoria de websockets)

## Despliegue local

1. Clonar el repositorio
2. Activar el ambiente virtual
3. Instalación de dependencias Python, correr el comando ```pip install -r req.txt``` el cual se encargará de instalar todas las librerias necesarias para iniciar el proyecto
4. Configurar tu base de datos local en el archivo settings.py (/backend/melmac/settings.py) donde hay un apartado de las bases de datos donde tendras que hacer cambios en el elemento default incluyendo el usuario(USER), contraseña(PASSWORD) y puerto(PORT, si la bd esta corriendo en otro puerto que no sea el 5432).
5. Correr el comando ```python manage.py runserver``` donde se podra verificar que el proyecto esta corriendo correctamente y estara publicado en la ruta http://localhost:8000 por defecto.

## Despliegue en servidor

1. Realizar pasos 1 a 3 del despliegue local.

2. Configurar base de datos de la misma forma descrita en el paso 4 del despliegue local, pero teniendo en cuenta el host por si la base de datos esta desplegada de manera externa.

3. Generar el archivo melmac.socket en la ruta ```/etc/systemd/system/``` de la siguiente manera
```
[Unit]
Description=Melmac Socket

[Socket]
ListenStream=/run/melmac.sock

[Install]
WantedBy=sockets.target
```
	* El elemento [Unit] incluye la información del nombre o como se reconocera el socket.
	* El elemento [Socket] indica donde se mantendra la comunicación del socket (que será el recipiente del despliegue de la aplicación)
	* El elemento [Install] indica que elementos van a necesitar de este elemento.

4. Generar el archivo melmac.service en la ruta ```/etc/systemd/system/``` de la siguiente manera
```
[Unit]
Description=Melmac daemon
Requires=melmac.socket
After=network.target

[Service]
User=user
Group=www-data
WorkingDirectory=/home/saroa/melmac/backend
ExecStart=/home/saroa/melmac/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind unix:/run/melmac.sock \
          melmac.wsgi:application

[Install]
WantedBy=multi-user.target
```
	* El elemento [Unit] contiene la información de reconocimiento del servicio, el socket que necesita para su correcto funcionamiento y el llamado que puede iniciar este servicio que en este caso hace referencia a que el servicio se iniciará despues de haber iniciado los elementos de red.
	* El elemento [Service] contiene la información para iniciar el servicio y el que debera correr con el mismo.
		* User indica el usuario que se utilizará para iniciar el servicio, siempre verificar que el usuario tenga permisos sobre la carpeta donde se corre el aplicativo.
		* Group indica el grupo que tiene permiso de acceso al elemento en cuestión, ya que este servicio trata con un despliegue de una aplicación web, se utiliza www-data que es el indicado en este caso.
		* WorkingDirectory hace referencia a la locación que se tomara como ruta principal, es decir, el servicio indicara que esta ubicado en esa ruta en especifico y no desde la ruta actual, esto ayuda bastante con el siguiente elemento.
		* ExecStart es el comando que se mantiene vivo en este servicio, en este ejemplo se muestra la ruta del ejecutable de gunicorn (servidor sincronico) que no se encuentra instalado en el sistema sino en el ambiente virtual de melmac.
			* --access-logfile - genera un archivo de log en la ruta de WorkingDirectory el cual guarda un registro de acceso que contiene las rutas a las que se intenta acceder, el codigo http con el que responde y que tipo de petición es.
			* --workers (n*2)+1 indica la cantidad de subprocesos o cuantas instancias del proyecto estan disponibles en su despliegue, el numero se obtiene a partir de la cantidad de nucleos que se tenga en el servidor (n).
			* --bind indica a que lugar o elemento se encuentra ligado el aplicativo, por defecto este elemento tiene el localhost:8000 pero en este caso apunta a la instancia de socket que iniciamos anteriormente.
			* melmac.wsgi:application es primero, la locación a partir del WorkingDirectory en formato de python (el cual utiliza los puntos en lugar de los /) donde, en este caso, se tiene la carpeta melmac que contiene la configuración del proyecto y en ella tenemos los archivos asgi y wsgi (que son los archivos de despliegue asincrono y sincrono respectivamente) a los cuales hacemos el llamado de que inicien el aplicativo (:application)
		* Install unicamente hace referencia a quienes pueden gestionar el servicio, en este caso cualquier usuario que reconozca el sistema puede iniciarlo, detenerlo y verificar su estado.

5. Habilitar e iniciar el socket con el comando ```sudo systemctl enable melmac.socket & sudo systemctl start melmac.socket```. Para verificar su correcto funcionamiento, utilizar el comando ```sudo systemctl status melmac.socket```
6. Iniciar el servicio con el siguiente comando ```sudo systemctl start melmac.service``` Si este comando falla, se mencionará inmediatamente.
7. Incluir la configuración de nginx, a continuación un ejemplo de la configuración necesaria para desplegar el proyecto de django
```
server {
   listen 80; #El puerto por el cual se puede acceder al aplicativo. 

   server_name [ip o dominio]; #La base de la url a la que se puede apuntar por ejemplo, '127.0.0.1' o 'ejemplo.com'

   location / { #La localización a partir del server_name
       include proxy_params; #Inclusión de parametros en la url
       proxy_pass http://unix:/run/melmac.sock; #Localización o repositorio interno de la aplicación, en este caso a la instancia del socket de melmac
   }
}
```
