# 📋 Matriz de Pruebas Funcionales y QA (Paso a Paso) - Melmac 2026

Este documento es una guía paso a paso, diseñada para que **cualquier persona** (incluso sin conocimiento técnico del sistema) pueda validar que la aplicación funciona correctamente. 

Por favor sigue cada paso de forma secuencial y valida que el "Resultado Esperado" coincida con lo que ves en pantalla.

---

## 🔐 1. Módulo de Autenticación (Inicio de Sesión)

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Carga de la pantalla inicial | Tener los servidores encendidos. | 1. Abre tu navegador web (Chrome/Edge). <br>2. Ingresa en la barra de direcciones: `http://localhost:4200` y presiona Enter. | La página debe cargar de inmediato mostrando el formulario de inicio de sesión. No debe quedarse una rueda de carga girando infinitamente. |
| **AUTH-02** | Validar campos vacíos | Estar en la pantalla de inicio de sesión. | 1. Deja los campos de "Usuario" y "Contraseña" totalmente en blanco.<br>2. Haz clic en el botón "Iniciar Sesión". | El sistema no debe dejarte avanzar. Los bordes de los campos deben ponerse en color rojo y debe aparecer un texto debajo indicando que los campos son obligatorios. |
| **AUTH-03** | Ingreso con datos incorrectos | Estar en la pantalla de inicio de sesión. | 1. En el campo Usuario escribe: `usuario_falso@esap.edu.co`.<br>2. En Contraseña escribe: `12345678`.<br>3. Haz clic en "Iniciar Sesión". | Debe aparecer un mensaje emergente (alerta roja o toast) en la pantalla indicando "Credenciales incorrectas" o "Error al iniciar sesión". No debes ingresar al sistema. |
| **AUTH-04** | Ingreso Exitoso | Tener credenciales reales creadas en el sistema. | 1. Escribe tu Usuario válido.<br>2. Escribe tu Contraseña válida.<br>3. Haz clic en "Iniciar Sesión". | La pantalla debe cambiar rápidamente y llevarte al panel principal (Dashboard). |

---

## 📊 2. Estadísticas y Dashboard (Panel Principal)

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **DASH-01** | Visualizar contadores numéricos | Haber iniciado sesión y estar en la pantalla inicial (`/pages/dashboard`). | 1. Ubica las tarjetas de resumen en la parte superior (las que muestran totales de Dispositivos, Documentos, etc.).<br>2. Lee los números que aparecen en cada tarjeta. | Los números mostrados deben tener sentido (ej. "15", "526"). No debe aparecer la palabra "NaN", "Undefined" o quedar el espacio en blanco. |
| **DASH-02** | Interactuar con las gráficas | Estar en el Dashboard. | 1. Baja un poco hasta ver las gráficas (ej. la gráfica circular o de torta).<br>2. Pasa el cursor del ratón (sin hacer clic) por encima de uno de los colores de la gráfica. | Al poner el ratón encima, debe aparecer un pequeño cuadro flotante (tooltip) que te indique el nombre del dato y su porcentaje/cantidad exacta. |

---

## 🗺️ 3. GeoPortal (Mapa interactivo)

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **GEO-01** | Carga del mapa base | Haber iniciado sesión. | 1. En el menú lateral izquierdo, haz clic en la opción "GeoPortal".<br>2. Espera unos segundos a que cargue la vista. | Debes ver un mapa estilo Google Maps/Leaflet que se dibuja por completo. No deben aparecer cuadros grises o imágenes rotas. |
| **GEO-02** | Interacción con pines agrupados | Estar en la vista de GeoPortal. | 1. Busca en el mapa unos círculos con números (que agrupan varios puntos).<br>2. Haz clic sobre uno de esos círculos numéricos. | El mapa debe acercarse automáticamente (zoom) hacia esa zona y los círculos se deben dividir en varios pines individuales. |
| **GEO-03** | Ver detalles de un pin | Estar en la vista de GeoPortal. | 1. Haz clic sobre uno de los pines (marcadores individuales) en el mapa. | Debe abrirse una pequeña viñeta o globo de información encima del pin, mostrando el nombre del lugar, coordenadas o datos del proyecto. |

---

## 📄 4. Módulo de Documentos y Formatos

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **DOC-01** | Crear un documento nuevo | Haber iniciado sesión. | 1. En el menú izquierdo, ve a "Documentos" y luego selecciona "Crear".<br>2. Llena los campos obligatorios (Ej: Título del documento, Descripción).<br>3. Haz clic en el botón de "Guardar" o "Enviar". | Debe aparecer un mensaje verde indicando "Guardado exitosamente". El formulario debe limpiarse y redirigirte a la lista de documentos. |
| **DOC-02** | Usar la firma digital | Estar en el formulario de creación o llenado de un documento. | 1. Ve a la sección inferior donde se pide la firma.<br>2. Haz clic dentro del recuadro blanco y, manteniendo el clic presionado, mueve el ratón para dibujar una firma de prueba.<br>3. Haz clic en guardar documento. | El recuadro debe seguir el movimiento de tu ratón dibujando una línea negra continua sin pausas ni interrupciones. El documento debe guardarse correctamente con la firma. |

---

## 👷 5. Servicio en Campo (Gestión de Proyectos y Visitas)

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **FLD-01** | Crear un Proyecto | Haber iniciado sesión. | 1. En el menú lateral, haz clic en "Visitas" y luego en "Proyectos".<br>2. Haz clic en el botón con el ícono de `+` (Agregar).<br>3. Escribe "Proyecto de Prueba 1" en el nombre.<br>4. Haz clic en el ícono del check (✔️) para guardar. | El registro debe guardarse y aparecer de primero en la tabla de proyectos. |
| **FLD-02** | Crear una Programación | Estar en el módulo de Visitas. | 1. En el menú lateral, ve a "Visitas" > "Programación".<br>2. Haz clic en el botón de "Nueva Programación".<br>3. En el calendario que aparece, selecciona la fecha de hoy.<br>4. Selecciona un técnico de la lista desplegable.<br>5. Haz clic en Guardar. | El sistema no debe mostrar error de fecha. Debe salir una alerta verde que diga "Programación creada con éxito" y aparecer listada en la pantalla. |
| **FLD-03** | Cambiar estado de Tarea | Tener una tarea/ticket ya creado. | 1. Ve a "Visitas" > "Tickets" (o Tareas).<br>2. Busca un ticket en estado "Pendiente".<br>3. En la columna de Estado, cámbialo seleccionando "Completado". | El estado debe cambiar inmediatamente y debe aparecer una alerta pequeña confirmando que la actualización fue exitosa en la base de datos. |

---

## 📂 6. Estación "Mi Unidad" (Carpetas Digitales)

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **DRV-01** | Crear una carpeta nueva | Haber iniciado sesión. | 1. En el menú lateral, ve a "Mi Unidad" o "Carpetas".<br>2. Busca y haz clic en el botón "Crear Carpeta".<br>3. Ponle de nombre "Carpeta de Prueba" y confirma. | Debes ver aparecer el ícono de una nueva carpeta llamada "Carpeta de Prueba" en tu pantalla. |
| **DRV-02** | Subir y descargar archivo | Tener creada "Carpeta de Prueba". | 1. Haz doble clic para entrar a "Carpeta de Prueba".<br>2. Haz clic en "Subir archivo" y selecciona cualquier PDF pequeño de tu computador.<br>3. Una vez subido, haz clic en el botón de "Descargar" al lado del archivo. | El archivo debe subirse mostrando una barra de progreso. Al descargar, el archivo debe bajar a tu computador y poder abrirse sin estar dañado. |

---

## ⚙️ 7. Módulo Ajustes (Administración)

| ID | Nombre de la Prueba | Pre-condiciones | Pasos Detallados a Ejecutar | Resultado Esperado (Lo que debes ver) |
| :--- | :--- | :--- | :--- | :--- |
| **CNF-01** | Crear un nuevo rol | Entrar con un usuario de tipo Administrador. | 1. En el menú lateral, ve a "Ajustes" > "Roles" (o Admin > Roles).<br>2. Haz clic en el botón de `+` (Agregar).<br>3. Escribe "Rol Temporal" y guárdalo.<br>4. Luego busca el "Rol Temporal" en la tabla y presiona el botón de la basura para borrarlo. | El rol debe aparecer en la tabla al guardarlo, y debe desaparecer de la tabla inmediatamente después de borrarlo, sin necesidad de recargar la página entera. |
| **CNF-02** | Modificar datos de Sucursal | Entrar con un usuario de tipo Administrador. | 1. Ve a "Ajustes" > "Sucursales" (o Locaciones).<br>2. Haz clic en el botón del lápiz (Editar) de una sucursal existente.<br>3. Cambia el nombre de la ciudad por "Bogotá D.C." y haz clic en guardar. | Los cambios deben guardarse correctamente sin arrojar errores técnicos o quedarse la pantalla paralizada. |
