# GestorAlquileres
Aplicación para gestionar alquileres en bloque de manera simplificada.

## Arquitectura propuesta (Frontend + Backend + Docker)

El proyecto queda dividido en dos servicios:

- `frontend`: aplicación React/Vite servida por Nginx.
- `backend`: API REST en Java 21 + Spring Boot.
- `db`: PostgreSQL 16 con volumen persistente (datos en .env).
- `adminer`: cliente web para gestionar la base de datos.

Ambos servicios se orquestan con `docker-compose` en una red interna compartida.

### Cómo levantar todo

1. Desde la raíz del proyecto ejecutar:

```bash
docker compose up --build
```

2. URLs disponibles:

- Frontend: `http://localhost:20300`
- Backend: `http://localhost:8080/api/health`
- Swagger local (proxy por frontend): `http://localhost:20300/api/swagger-ui/index.html`
- Adminer local: `http://localhost:20302`

3. Para detener los contenedores:

```bash
docker compose down
```
