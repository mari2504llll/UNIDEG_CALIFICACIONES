# Sistema de Calificaciones UNIDEG — Guía de implementación

Este paquete completa tu proyecto React + Vite (que ya tienes corriendo en
`localhost:5173`) con lo que faltaba:

- ✅ Edición de calificaciones (solo el maestro dueño de la materia)
- ✅ Base de datos en Supabase (persistente, no se pierde al cerrar la terminal)
- ✅ Exportar calificaciones individuales en PDF y Excel
- ✅ Asignación de materias por maestro
- ✅ Login con Supabase Auth
- ✅ 3 roles: Director, Maestro, Alumno
- ✅ El director ve todas las calificaciones que han capturado los maestros (con historial de cambios)

## 1. Crear el proyecto en Supabase

1. Ve a https://supabase.com → **New project**.
2. Cuando esté listo, entra a **SQL Editor** → **New query**, pega todo el
   contenido de `sql/schema.sql` y ejecútalo. Esto crea las tablas,
   los roles y las reglas de seguridad (RLS) para que cada quien solo
   vea lo que le corresponde.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → será tu `VITE_SUPABASE_URL`
   - `anon public key` → será tu `VITE_SUPABASE_ANON_KEY`
   - `service_role key` (solo para el script de importación, nunca la subas a GitHub ni la pongas en el frontend)

## 2. Cargar tus datos del Excel

En tu computadora, con el `concentrado_anonimizado.xlsx`:

```bash
pip install pandas openpyxl supabase --break-system-packages
export SUPABASE_URL="https://tuproyecto.supabase.co"
export SUPABASE_SERVICE_KEY="tu-service-role-key"
python scripts/import_excel_to_supabase.py concentrado_anonimizado.xlsx
```

Esto crea automáticamente las materias, los alumnos y sus calificaciones.

## 3. Crear usuarios (login)

En Supabase → **Authentication → Users → Add user**, crea una cuenta por
cada director/maestro/alumno que necesite entrar (correo + contraseña).

Al crearse el usuario, un trigger automático le crea su fila en `profiles`
con rol `alumno` por default. Luego, en **Table Editor → profiles**:

- Cambia el `role` a `director` o `maestro` según corresponda.
- Para un **alumno**, en la tabla `alumnos` pon su `profile_id` igual al
  `id` del usuario que creaste (así el sistema sabe qué alumno es).
- Para un **maestro**, en la tabla `maestro_materia` agrega una fila por
  cada materia que va a impartir (`maestro_id` + `materia_id`).

## 4. Conectar tu proyecto React

Copia estas carpetas dentro de tu proyecto Vite existente (sustituyendo si
ya tenías `src/App.jsx`):

```
frontend/src/lib          → tu-proyecto/src/lib
frontend/src/context      → tu-proyecto/src/context
frontend/src/components   → tu-proyecto/src/components
frontend/src/pages        → tu-proyecto/src/pages
frontend/src/utils        → tu-proyecto/src/utils
frontend/src/App.jsx      → tu-proyecto/src/App.jsx
frontend/src/styles.css   → tu-proyecto/src/styles.css
```

Instala las dependencias que faltan:

```bash
npm install @supabase/supabase-js react-router-dom jspdf jspdf-autotable xlsx
```

Crea el archivo `.env` en la raíz de tu proyecto (usa `frontend/.env.example`
como plantilla) con tu URL y anon key de Supabase.

Corre el proyecto normalmente:

```bash
npm run dev
```

## 5. Cómo queda repartido cada rol

| Rol | Puede |
|---|---|
| **Alumno** | Ver únicamente sus propias calificaciones, exportarlas en PDF/Excel |
| **Maestro** | Ver y **editar** las calificaciones solo de las materias que tiene asignadas |
| **Director** | Ver **todas** las calificaciones de todos los maestros, con filtro por materia/maestro y fecha de última edición (supervisión, no edita directamente) |

Todo cambio de calificación queda registrado en `calificaciones_historial`
(quién cambió qué, valor anterior y nuevo) — eso es lo que le da al director
trazabilidad real de lo que hace cada maestro.

## Notas

- Este paquete asume que tu Excel siempre trae los encabezados en la fila 9,
  como en tu archivo actual — si cambia el formato, ajusta `header=8` en
  `scripts/import_excel_to_supabase.py`.
- Las políticas de RLS (`sql/schema.sql`) son las que de verdad impiden que
  un alumno vea calificaciones de otro, o que un maestro edite una materia
  que no es suya — esto pasa a nivel de base de datos, no solo en el frontend.
- Si más adelante quieres periodos distintos (ENE-JUN, otro ciclo), ya está
  contemplado en la columna `periodo` de `calificaciones`.
