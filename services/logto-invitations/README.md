# Betipo Logto Invitations

Microservicio de administracion para invitaciones de Logto. Crea one-time tokens mediante la Management API, envia el magic link con Resend y permite listar, reenviar y revocar invitaciones activas.

## Logto

1. Crea una aplicacion `Machine-to-machine` en Logto.
2. Asignale el rol M2M preconfigurado `Logto Management API access`.
3. Guarda su App ID y App Secret como `LOGTO_M2M_APP_ID` y `LOGTO_M2M_APP_SECRET`.

El resource indicator de la Management API en Logto OSS es `https://default.logto.app/api` y esta fijado en el servicio.

## Resend

1. Verifica un dominio en Resend.
2. Crea una API key con permiso de envio.
3. Configura `RESEND_API_KEY` y un remitente verificado en `RESEND_FROM`.

## Dokploy

1. Crea una nueva Application usando este mismo repositorio.
2. Selecciona build con Dockerfile y usa `services/logto-invitations/Dockerfile` como ruta. El contexto de build debe ser la raiz del repositorio.
3. Configura las variables de `.env.example` en la aplicacion.
4. Asigna `invites-betipo-tools.monteserin.dev` al puerto interno `3000`, con HTTPS.
5. Despliega y comprueba `/health`.

La interfaz esta protegida con HTTP Basic Auth. Usa una contrasena aleatoria larga para `ADMIN_PASSWORD`; las credenciales solo viajan por HTTPS.
