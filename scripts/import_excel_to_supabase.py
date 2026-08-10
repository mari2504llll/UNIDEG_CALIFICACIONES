"""
Importa concentrado_anonimizado.xlsx a Supabase (materias, alumnos, calificaciones).

Uso:
    pip install pandas openpyxl supabase --break-system-packages
    export SUPABASE_URL="https://xxxx.supabase.co"
    export SUPABASE_SERVICE_KEY="tu-service-role-key"   # NUNCA la key anon, esta es solo para el script
    python import_excel_to_supabase.py ruta/al/concentrado_anonimizado.xlsx

El service_role key se usa solo aquí, en tu máquina, para saltar RLS al hacer
la carga inicial masiva. Nunca la pongas en el frontend.
"""
import os
import sys
import pandas as pd
from supabase import create_client

EXCEL_PATH = sys.argv[1] if len(sys.argv) > 1 else "concentrado_anonimizado.xlsx"
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# La fila 9 (índice 8) del Excel contiene los encabezados reales
df = pd.read_excel(EXCEL_PATH, sheet_name="concentrado", header=8)
df.columns = [str(c).strip() for c in df.columns]  # quita espacios como " Parcial1"
df = df.dropna(subset=["Matricula", "Nombre Alumno"])

print(f"Filas leídas: {len(df)}")

# ---------- 1) MATERIAS (únicas) ----------
materias_df = df[["clave Materia", "Materia"]].drop_duplicates()
materias_map = {}
for _, row in materias_df.iterrows():
    clave = str(row["clave Materia"]).strip()
    nombre = str(row["Materia"]).strip()
    if not clave or clave == "nan":
        continue
    res = supabase.table("materias").upsert(
        {"clave": clave, "nombre": nombre}, on_conflict="clave"
    ).execute()
    materias_map[clave] = res.data[0]["id"] if res.data else None

print(f"Materias insertadas: {len(materias_map)}")

# ---------- 2) ALUMNOS (únicos) ----------
alumnos_df = df[["Matricula", "Nombre Alumno", "Especialidad", "Subsistema", "Centro", "Plan"]].drop_duplicates(subset=["Matricula"])
alumnos_map = {}
for _, row in alumnos_df.iterrows():
    matricula = str(row["Matricula"]).strip()
    res = supabase.table("alumnos").upsert({
        "matricula": matricula,
        "nombre": str(row["Nombre Alumno"]).strip(),
        "especialidad": row.get("Especialidad"),
        "subsistema": row.get("Subsistema"),
        "centro": row.get("Centro"),
        "plan": str(row.get("Plan")) if pd.notna(row.get("Plan")) else None,
    }, on_conflict="matricula").execute()
    alumnos_map[matricula] = res.data[0]["id"] if res.data else None

print(f"Alumnos insertados: {len(alumnos_map)}")

# ---------- 3) CALIFICACIONES ----------
def clean_num(v):
    try:
        if pd.isna(v):
            return None
        return float(v)
    except (ValueError, TypeError):
        return None

inserted = 0
for _, row in df.iterrows():
    matricula = str(row["Matricula"]).strip()
    clave_materia = str(row["clave Materia"]).strip()
    alumno_id = alumnos_map.get(matricula)
    materia_id = materias_map.get(clave_materia)
    if not alumno_id or not materia_id:
        continue

    supabase.table("calificaciones").upsert({
        "alumno_id": alumno_id,
        "materia_id": materia_id,
        "periodo": "SEPT-DIC",
        "parcial1": clean_num(row.get("Parcial1")),
        "parcial2": clean_num(row.get("Parcial2")),
        "parcial3": clean_num(row.get("Parcial3")),
        "final": clean_num(row.get("Final")),
        "extra1": clean_num(row.get("Extra1")),
        "extra_rec1": clean_num(row.get("Extra Rec 1")),
        "estatus": row.get("Estatus"),
        "tipo_curso": row.get("tipo Curso"),
    }, on_conflict="alumno_id,materia_id,periodo").execute()
    inserted += 1

print(f"Calificaciones insertadas/actualizadas: {inserted}")
print("Listo. Ahora crea usuarios en Supabase Auth y asigna el 'role' y 'matricula' en la tabla profiles.")
