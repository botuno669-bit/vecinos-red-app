# Vecindad Red - Sistema de Prestamos Comunitarios

## Integrantes del Grupo 1 y Roles Asignados
- **Cristian**: Backend Developer (Logica del servidor, base de datos, endpoints de la API, autenticacion y manejo de errores)
- **Castaño**: Frontend Developer (Interfaz de usuario, consumo de la API, experiencia de usuario y diseno responsivo)
- **Bonilla**: Git Master + Documentador (Gestion del repositorio, ramas, Pull Requests, documentacion tecnica completa y coordinacion del despliegue)

## Introduccion y Problema a Resolver
Aplicacion transaccional desarrollada para conjuntos residenciales donde los vecinos comunican y publican objetos disponibles para prestamo (herramientas, electrodomesticos, implementos deportivos); otros vecinos los solicitan, y el sistema gestiona todo el ciclo del prestamo de forma segura desde la solicitud primaria hasta la devolucion.

## Cumplimiento de Requisitos del Taller Evaluativo Final

### Requisitos Minimos Obligatorios:
- **Minimo 5 tablas relacionadas con integridad referencial:** Cumplido. La base de datos posee 8 tablas normalizadas en Tercera Forma Normal (3FN) con Constraints restrictivos en cascada.
- **Autenticacion de usuarios con 2 roles diferenciados:** Cumplido. Roles 'admin' y 'resident' implementados con middleware de autorizacion.
- **Al menos 1 endpoint o vista de reporte que agregue datos:** Cumplido. El modulo "Control Central" (Dashboard Administrativo) realiza consultas agrupadas de metricas en la base de datos (Ej: Prestamos por categoria, Historial de deudas, etc).
- **Stack tecnologico declarado desde el inicio:** Cumplido y listado en la arquitectura del proyecto inferior.
- **Repositorio y Versionamiento:** Historial estricto con commits semanticos y ramas de despliegue controlado.

### Retos Tecnicos del Grupo 1 Resueltos:
1. **Estados del prestamo:** Implementado el flujo transicional: disponible -> solicitado -> en prestamo -> devuelto -> retrasado.
2. **Alertas y Fechas de Vencimiento:** Notificaciones del sistema para trazabilidad temporal de dias y penalidad de comportamiento.
3. **Sistema de Calificaciones Bidireccional:** Implantacion de evaluacion doble ciega final donde tanto el prestatario como el prestamista se califican (1 a 5 estrellas).
4. **Historial y Trazabilidad:** Bitacoras inmutables para disputas entre residentes y auditoria de la administracion.

## Arquitectura Tecnologica y Stack

### Backend (Laravel 11) - Lenguaje PHP
- **Autenticacion:** Resolucion mediante tokens Bearer a traves de Laravel Sanctum.
- **Base de Datos:** Entorno PostgreSQL para asegurar robustez en transacciones cruzadas.
- **Lógica de Negocio:** FormRequests para sanitizacion de datos, validacion ciclica temporal para evitar dobles prestamos simultaneos de un mismo item, y generacion encriptada de codigos OTP para confirmacion fisica.

### Frontend (React 18 + Vite) - Lenguaje Javascript
- **Estetica y framework:** Aplicacion responsiva creada enteramente con Tailwind CSS, implementando efectos visuales modernos.
- **Control de Estado:** Hook nativo (Context API) y Axios Interceptors para retencion y depuracion de Tokens.
- **Experiencia de Usuario:** Animaciones vectoriales gestionadas por Framer Motion y exportacion local en PDF mediante jsPDF para tickets comprobantes.

## Instrucciones de Instalacion, Configuracion y Despliegue Local

### Consideraciones Previas de Sistemas
Es requerido contar en el ambiente operativo con PHP (>=8.2), Composer, Node.js y un servicio de PostgreSQL de libre disposicion.

### Fase 1: Levantamiento del Servidor
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Se debe configurar en .env las directrices DB_CONNECTION=pgsql, DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD.

php artisan migrate --seed
php artisan serve
```

### Fase 2: Levantamiento del Cliente Visual
```bash
cd frontend
npm install

# Instanciar el despliegue del modo de desarrollo. Las variables externas del backend apuntaran a localhost por defecto.

npm run dev
# El entorno virtual estara servido en http://localhost:5173
```
