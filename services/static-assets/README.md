# Static Assets

Servicio Nginx para publicar assets compartidos desde `assets.monteserin.dev`.

## URLs

- `https://assets.monteserin.dev/health`
- `https://assets.monteserin.dev/betipo/favicon.png`
- `https://assets.monteserin.dev/betipo/logo-black.webp`

Para incorporar otra aplicacion, crea una carpeta junto a `betipo` y anade su
correspondiente instruccion `COPY` al Dockerfile.

## Dokploy

1. Crea una Application usando este repositorio.
2. Selecciona build con Dockerfile.
3. Usa `services/static-assets/Dockerfile` como ruta del Dockerfile.
4. Configura `services/static-assets` como Docker Context Path.
5. Asigna `assets.monteserin.dev` al puerto interno `80`, con HTTPS.
6. No configures variables de entorno ni volumenes.
7. Despliega y comprueba `/health` y las URLs de los assets.

## Logto

Configura estas URLs en la experiencia de inicio de sesion:

```text
Logo:    https://assets.monteserin.dev/betipo/logo-black.webp
Favicon: https://assets.monteserin.dev/betipo/favicon.png
```

El servicio permite acceso entre origenes porque los assets son publicos. Los
archivos se sirven con ETag y una cache de una hora para permitir actualizarlos
sin cambiar inmediatamente su URL.
