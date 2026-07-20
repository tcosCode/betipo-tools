# Reproducción del fallback de campañas

## Problema

El backend intenta buscar la campaña fallback con:

```ts
ArrayContains([]);
```

TypeORM traduce esa condición al operador PostgreSQL `@>`:

```sql
ids_planes_aplicables @> ARRAY[]::uuid[]
```

Todos los arrays contienen al array vacío, por lo que esta consulta coincide con todas las
campañas activas y no solamente con la campaña cuya audiencia es vacía.

## Prueba determinista

Después de crear la campaña fallback, ejecutar en desarrollo:

```sql
SELECT uuid, nombre, ids_planes_aplicables
FROM public.campannas
WHERE deleted_at IS NULL
  AND ids_planes_aplicables @> ARRAY[]::uuid[];
```

### Resultado actual

La consulta devuelve la campaña fallback y también las campañas específicas con planes en su
audiencia.

### Resultado esperado

Debería devolver exclusivamente la campaña fallback.

La condición correcta es una de estas:

```sql
ids_planes_aplicables = ARRAY[]::uuid[]
```

```sql
cardinality(ids_planes_aplicables) = 0
```

## Escenario de integración

Preparar estas campañas activas:

```text
Campaña A: ids_planes_aplicables = [plan-a]
Campaña B: ids_planes_aplicables = [plan-b]
Fallback:  ids_planes_aplicables = []
```

Probar una inmobiliaria cuyo plan activo sea `plan-c`, que no pertenece a A ni B.

1. La búsqueda específica no debe encontrar campaña.
2. La búsqueda fallback debe devolver únicamente `Fallback`.
3. Con `ArrayContains([])`, `findOne` puede devolver A, B o Fallback sin un orden garantizado.

## Casos de regresión recomendados

1. `plan-a` devuelve Campaña A, aunque exista fallback.
2. `plan-c` devuelve Fallback.
3. Una campaña fallback con `deleted_at` no participa en la resolución.
4. La ausencia de fallback devuelve una respuesta controlada, no un error 500.
5. Más de una campaña fallback activa se trata como conflicto de configuración.
