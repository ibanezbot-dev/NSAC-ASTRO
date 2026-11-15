---
name: k12-edugame-web-architect
description: Audita, corrige, disena y construye paginas web educativas, simuladores y videojuegos para ninos de 7 a 12 anos, con pedagogia, UX diegetica, accesibilidad y ganancia de aprendizaje verificable.
---
# k12-edugame-web-architect

Esta skill transforma cualquier pagina web o prototipo interactivo en una experiencia educativa para ninos de 7 a 12 anos de alto impacto, auditando fallos pedagogicos o de usabilidad y generando codigo nuevo alineado con las mejores practicas de diseno instruccional y arquitectura web inspiradas en NASA Kids Club y estandares STEM.

## When to Use

- El usuario pide auditar, corregir o mejorar una pagina web educativa, juego serio o simulador para ninos de 7 a 12 anos.
- El usuario solicita crear desde cero un modulo interactivo, un Hub exploratorio, un minijuego o una interfaz web para ninos de 7 a 12 anos.
- Se requiere transformar contenido teorico o estandares curriculares (NGSS, NCTM, CCSS, STEM) en mecanicas de juego que generen ganancia real de aprendizaje (learning gain).
- El usuario busca optimizar la ergonomia tactil, la accesibilidad infantil (Section 508 / WCAG), la privacidad sin cuentas (COPPA) o la telemetria de aprendizaje en una aplicacion web.

## Steps

### Paso 1: Determinar el Modo de Operacion (Auditoria vs. Creacion)

Identifica si el usuario entrego codigo/diseno existente o si solicita un componente nuevo:

- **Modo Auditoria y Correccion:** Analiza el codigo HTML/CSS/JS o la descripcion de la interfaz contra la matriz de los 6 Pilares (Pasos 2 al 7). Enumera especificamente que criterios incumple, explica por que afectan la ganancia de aprendizaje y entrega el codigo refactorizado.
- **Modo Creacion desde Cero:** Disena la arquitectura y escribe el codigo aplicando directamente los 6 Pilares desde el primer bloque, justificando como cada decision tecnica respalda el objetivo pedagogico.

### Paso 2: Aplicar Diseno Inverso (Backward Design) y Andamiaje en 5 Niveles

Asegura que el aprendizaje sea el motor de la mecanica y no un cuestionario aislado:

- **Nucleo Jugable (Core Loop):** Convierte el concepto educativo en la variable que el jugador manipula para ganar (por ejemplo, balancear energia, escudos y soporte vital, o completar secuencias logicas) en lugar de interrumpir el juego con preguntas de opcion multiple.
- **Personalizacion de Variables:** Permite que el usuario ingrese o controle parametros propios para observar relaciones de causa y efecto en tiempo real (inspiracion por verificar: Astro-Matic, sin fuente aun).
- **Andamiaje por Habilidad (Niveles 1 a 5):** Clasifica la dificultad del Nivel 1 al Nivel 5 dentro de cada modo de edad (7 a 9 anos y 10 a 12 anos). El modo fija la interaccion y la carga visible; el nivel fija la dificultad. Esto permite avanzar a ninos sobresalientes sin cambiar de modo (Zona de Desarrollo Proximo).

### Paso 3: Disenar Interfaz Diegetica (Exploratory Hub) con Piso Bajo y Techo Alto

Reemplaza los menus de texto tradicionales por entornos explorables:

- **Hub Espacial o Laboratorio Interactivo:** Presenta el menu principal como una habitacion, consola o estacion donde cada objeto visual representa un modulo o actividad.
- **Affordance Visual y Sonoro:** Garantiza que todo elemento interactivo brille, escale suavemente al pasar el cursor (hover/touch) en menos de 100 ms y anuncie su funcion visualmente.
- **Piso Bajo (Low Floor):** Elimina las paredes de texto al inicio. Un nino debe entender que hacer en menos de 5 segundos mediante iconografia clara, animaciones guia y controles visuales.
- **Techo Alto (High Ceiling):** Para el modo de 10 a 12 anos, incorpora paneles de simulacion de sistemas con multiples variables interconectadas y graficas de respuesta en vivo.

### Paso 4: Implementar Entorno Seguro para Fallar (Safe-to-Fail) y Feedback Formativo

Elimina las mecanicas punitivas que bloquean la exploracion cientifica:

- **Cero Game Over Punitivo:** Prohibe las pantallas de derrota total que obliguen a reiniciar desde cero o el uso de vidas agotables que castiguen la experimentacion.
- **Pistas Progresivas Automatizadas:** Cuando el usuario cometa un error, proporciona retroalimentacion formativa inmediata explicando la causa fisica o logica del fallo. En el segundo intento fallido, resalta la zona correcta o reduce las opciones distractoras para guiar el descubrimiento autonomo.
- **Combinacion de Objetivos y Sandbox:** Ofrece metas estructuradas junto con espacios de experimentacion libre para fomentar el sentido de propiedad del estudiante.

### Paso 5: Blindar la Arquitectura Tecnica Web (Rendimiento, Ergonomia y Privacidad)

Al escribir o corregir codigo HTML, CSS y JavaScript, aplica estos requisitos tecnicos verificables:

- **Hitboxes Ergonomicos:** Define areas clicables o tactiles de minimo `64x64 px` (decision de diseno para ninos de 7 a 9 anos; WCAG 2.2 exige 24x24 px como minimo y 44x44 px es la recomendacion AAA) con separacion suficiente para evitar toques accidentales en tabletas o pantallas escolares.
- **Bloqueo de Orientacion (Viewport Lock):** Incluye deteccion mediante CSS (`@media (orientation: portrait)`) o JavaScript para mostrar un aviso visual amigable que invite a girar el dispositivo a modo horizontal (landscape) cuando la interfaz requiera ancho completo.
- **Preloader Visual:** Implementa una barra de progreso porcentual (`0% - 100%`) para la carga de activos (solo si se usan activos externos; el prototipo base no los necesita), evitando pantallas en blanco o saltos de diseno (CLS).
- **Privacidad Infantil (COPPA Stateless):** No solicites correos, nombres reales, inicios de sesion ni bases de datos externas de usuarios. Guarda todo el progreso, medallas y configuracion exclusivamente en `localStorage` o `sessionStorage`.

### Paso 6: Integrar Accesibilidad Multimodal, Contexto Real y Guia Docente

Completa la experiencia educativa con soporte inclusivo y transferencia al mundo real:

- **Sistema de Audio en 3 Capas y Lectura en Voz Alta (TTS):** Estructura controles visibles e independientes en la esquina superior para silenciar musica de fondo (BGM), efectos de sonido (SFX) y locucion de instrucciones (usando `window.speechSynthesis` o audios pregrabados) para prelectores o usuarios con baja vision.
- **Alto Contraste y Teclado (WCAG / Section 508):** Asegura una relacion de contraste minima de `4.5:1` en textos e indicadores, navegacion completa mediante tecla `Tab` con `:focus-visible` evidente y etiquetas `aria-label` descriptivas en cada control del `<canvas>` o DOM.
- **Anclaje con el Mundo Real:** Conecta cada mecanica con datos reales (APIs cientificas, fotografias autenticas o aplicaciones cotidianas llamadas Spinoffs) mediante capsulas breves de contexto al completar un reto.
- **Modal para Padres y Maestros:** Incluye siempre un boton discreto de "Guia Docente / Padres" que abra un panel detallando el estandar curricular trabajado, la habilidad cognitiva que entrena el modulo y 3 preguntas detonadoras para conversar con el estudiante despues de jugar.

### Paso 7: Inyectar Telemetria de Ganancia de Aprendizaje (Learning Gain Analytics)

Para demostrar cientificamente que el juego ensena, incluye un modulo ligero de telemetria en memoria o exportable en JSON que registre:

- **Curva de Reduccion de Errores:** Comparativa de intentos fallidos en la primera ronda frente a las rondas posteriores del mismo concepto.
- **Tiempo de Toma de Decision:** Latencia entre la aparicion del reto y la accion correcta.
- **Dominio por Nivel:** Porcentaje de exito al subir del Nivel 1 al Nivel 5 sin requerir pistas asistidas.
- **Conexion con la bitacora:** Cada evento de telemetria se muestra al maestro como entrada de bitacora, con su decision y su fuente.

### Paso 8: Justificar cada decision con fuente

Cada mecanica, pauta de diseno o cifra debe llevar una fuente con URL o referencia del proyecto (PDF). Si no se verifico, se marca como pendiente y no como dato. Registrar las fuentes en una tabla con tres columnas: decision, fuente y URL.

## Gotchas

- **Convertir el juego en un examen disfrazado:** Nunca detengas la accion principal para abrir un modal con preguntas de texto tipo examen escolar. Si necesitas evaluar comprension, haz que el usuario ajuste controles o resuelva una anomalia dentro de la simulacion.
- **Saturar la memoria de trabajo infantil (Carga Cognitiva Extrinseca):** Evita mostrar mas de 3 modulos o variables primarias simultaneamente en pantalla para 7 a 9 anos, y mas de 4 para 10 a 12 (Wouters et al. 2008; handbook de Interaction Design & Children). Agrupa la informacion secundaria en pestanas o paneles desplegables bajo demanda.
- **Depender solo del color para indicar estados:** Un nino con daltonismo no distinguira una alerta roja de un estado verde. Acompana siempre los cambios de color con iconos distintivos, patrones visuales y alertas sonoras suaves.
- **Romper el flujo por falta de activos:** Al generar codigo nuevo, utiliza graficos vectoriales SVG inline, CSS avanzado y la API nativa `Web Audio API` o `speechSynthesis` para que el prototipo funcione al 100% desde el primer segundo sin depender de archivos externos rotos.
