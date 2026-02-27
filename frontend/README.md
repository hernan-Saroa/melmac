# **Manual despliegue Melmac - Frontend** 

## Requisitos

* Node (14+ se recomienda v14.19.3)
* npm (se recomienda 6.14.17)
* angular/cli (se recomienda 14.2.7)

## Preparación para despliegue

1. Clonar el repositorio
2. Ubicarse dentro de la carpeta del proyecto
3. Instalar las dependencias con el comando ```npm install``` lo cual instala todas las dependencias que se encuentran en el archivo package.json
4. Hacer cambios de Urls según se necesite para los servicios.
5. En caso de errores tener en cuenta la versión del npm (npm install -g npm@6.14.17).

## Despliegue Local

Para despliegue local se puede utilizar el comando ```ng serve --watch``` el cual inicia el proyecto en la url localhost:4200 por defecto, el parametro --watch sirve para que el servidor este pendiente de los cambios de codigo para recompilar cada que sea necesario.


## Despliegue en Servidor

1. Se deben generar los archivos a los que tendra que apuntar nginx, para lo cual se corre el comando ```ng build``` se puede incluir el parametro --prod para indicar que es despliegue a producción y tambien se puede generar un servicio que mantenga el ng build con el parametro --watch que funciona de la misma manera que el ```ng serve --watch``` en este caso.
2. Realizar la configuración de nginx correspondiente, para mas detalles consultar https://angular.io/guide/deployment