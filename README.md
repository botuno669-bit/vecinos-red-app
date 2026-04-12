# 📦 Vecindad Red - Sistema de Préstamos Comunitarios

Un sistema avanzado y seguro diseñado para fomentar la economía circular dentro de un conjunto residencial o comunidad, permitiendo a los vecinos publicar objetos, solicitar préstamos, negociar plazos y calificar su experiencia, todo respaldado por una API robusta y un Frontend con la más exquisita estética moderna.

---

## 🛠 Arquitectura Tecnológica

### Backend (Laravel 11)
El corazón transaccional del sistema.
- **Autenticación Segura:** API protegida con Sanctum, manejando barreras lógicas basadas en el estado del usuario (`is_active`). Autenticación basada en Bearer Tokens.
- **Gestión de Base de Datos:** Migraciones, Seeders optimizados, relaciones Elocuentes (1:N, N:N) usando **PostgreSQL**.
- **Reglas de Negocio Estrictas:**
  - `FormRequests` para validaciones de datos y respuestas traducidas al español (Ej: `StoreLoanRequest`, `RegisterRequest`).
  - Bloqueo de Auto-préstamos.
  - Validación de solapamiento de préstamos (Evitando que un objeto prestado pueda volver a ser solicitado simultáneamente).
- **Flujo de Estados (State Machine):** El ciclo de vida de un préstamo transcurre por los estados: `pending_owner` → `negotiating` → `pending_handover` → `active` → `return_pending` → `completed`.
- **Generación Algorítmica:** Códigos seguros OTP (6 caracteres) para confirmación criptográfica de entregas físicas de objetos.

### Frontend (React 18 + Vite)
La interfaz inmersiva y de alto impacto visual.
- **Estética Premium ("Glassmorphism"):** Diseño de Cristal con fondos desenfocados (`backdrop-blur`), elevaciones suaves y jerarquía de UI limpia usando Tailwind CSS.
- **Animaciones Suaves:** Transiciones dinámicas impulsadas por `Framer Motion` (Efectos Pop, Staggering, Hover Cards), dándole una sensación fluida de Single Page Application móvil.
- **Control Global de Estados:** Gestión integral empleando React Context (`useAuth`) para la sesión persistente e interceptores de seguridad `Axios` para rebotar sesiones caducadas.
- **Modales Customizados:** La erradicación total de alertas nativas (`alert/prompt`) a favor de interfaces controladas con React, mejorando la inmersión de los flujos de códigos y operaciones.
- **Exportación a PDF:** Impresión bajo demanda de Comprobantes Legales de préstamo a través de `jspdf` y `jspdf-autotable`.

---

## 🚀 Guía de Despliegue Local (Desarrollo)

Asegúrate de contar con PHP (>=8.2), Composer, Node.js y una base de datos PostgreSQL activa.

**1. Levantando el Backend**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configura las credenciales de BD en .env
php artisan migrate --seed
php artisan serve
```

**2. Levantando el Frontend**
```bash
cd frontend
npm install
npm run dev
# Vite levantará un servidor local (por defecto: http://localhost:5173)
```

---

## 🧭 Flujo Funcional (Cómo usarlo frente al Jurado)

1. **Dashboard:** El usuario observa un resumen analítico con sus métricas directas (Objetos prestados, reputación).
2. **Registro e Inventario:** El usuario sube su objeto en `Mis Objetos`, dictando su estado físico y URL de imagen referencial.
3. **Petición Circular:** Otro vecino revisa el `Catálogo` (animado y con filtros interactivos) y decide solicitar un objeto.
4. **Negociación Viva:** Desde el menú `Préstamos`, el solicitante envía 7 días. El Propietario revisa la petición y decide enviar una "Contraoferta" exigiendo devolución en 3 días. El sistema lleva traza de los cambios.
5. **Aprobación & Código OTP:** El Propietario aprueba la entrega. Aparecerá un Botón para ver el "Código de Entrega".
6. **Mano a Mano:** El prestatario recibe las llaves del objeto en la vida real, y para cerrar el trato cibernético recibe el "Código OTP" del dueño y lo ingresa en su propio panel.
7. **Comprobante Comercial:** Tras activarse el préstamo, cualquiera puede generar un Recibo en **PDF** detallando el pacto acordado.

---

**Nota Final:**
La plataforma ha sido sanitizada contra inyecciones e incluye gestión meticulosa de respuestas HTTP (422 Unprocessable Entity, 401 Unauthorized, 404 Not Found), garantizando estabilidad inquebrantable durante su uso.
