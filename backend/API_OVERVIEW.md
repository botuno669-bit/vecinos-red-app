# API Overview

Base local:

```text
http://localhost:8000/api
```

Variables importantes:

```text
FRONTEND_URL=
VITE_API_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `PUT /auth/profile`
- `GET /auth/google/redirect`
- `GET /auth/google/callback`

## Marketplace público

- `GET /categories`
- `GET /items`
- `GET /items/{id}`

## Dashboard privado

- `GET /dashboard`

## Objetos

- `GET /items/mine`
- `POST /items`
- `PUT /items/{id}`
- `DELETE /items/{id}`

Campos soportados en creación/edición:

- `name`
- `description`
- `category_id`
- `condition`
- `image` archivo
- `image_url` URL externa
- `status` solo en edición

## Préstamos

- `POST /loans`
- `GET /loans/borrowed`
- `GET /loans/lent`
- `GET /loans/{id}`
- `POST /loans/{id}/approve`
- `POST /loans/{id}/counter-offer`
- `POST /loans/{id}/cancel`
- `POST /loans/{id}/confirm-handover`
- `GET /loans/{id}/handover-code`
- `POST /loans/{id}/start-return`
- `POST /loans/{id}/confirm-return`
- `POST /loans/{id}/rate`
- `POST /negotiations/{id}/accept`

## Flujo nuevo

1. El usuario publica el objeto.
2. Otro usuario crea la solicitud.
3. El dueño aprueba o contraoferta.
4. Al aprobar, el objeto sale del marketplace y queda reservado.
5. El prestatario confirma la entrega con el código del dueño.
6. El préstamo pasa a activo y desde ahí corre el tiempo.
7. El prestatario inicia devolución y obtiene un código.
8. El dueño confirma la devolución con ese código.
9. El objeto vuelve a quedar disponible.
10. Ambas partes pueden calificar.

## Notificaciones

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`

## Admin

- `GET /admin/dashboard`
- `GET /admin/users`
- `PATCH /admin/users/{id}/toggle`

## Notas

- El login soporta `remember`.
- El backend usa Bearer token con Sanctum.
- El flujo de aprobación quedó separado del de entrega real.
- Las imágenes ya se pueden subir por archivo usando el disco `public`.
