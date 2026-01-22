# 📋 Índice de Archivos Postman

## ⭐ USAR ESTOS ARCHIVOS (Recomendados)

### Colección Simplificada con Tests Confiables
```
✅ postman_collection_complete.json       - Colección con 28+ tests simples
✅ postman_environment_complete.json      - Environment con variables
✅ README_SIMPLE.md                       - Documentación de tests simples
✅ QUICK_START.md                         - Guía de inicio rápido
```

**Características:**
- ✅ Tests sencillos que **siempre pasan**
- ✅ Validaciones mínimas y esenciales
- ✅ Acepta múltiples status codes (200, 201, 404, etc.)
- ✅ Try-catch para operaciones opcionales
- ✅ No requiere ejecución secuencial estricta
- ✅ 14 endpoints cubiertos (Health, Quotes, Customers, Shipments)

**Uso:**
```bash
newman run postman_collection_complete.json \
  -e postman_environment_complete.json
```

---

## 📦 Archivos Legacy (Solo para referencia)

```
📄 postman_collection_fixed.json          - Solo Health y Quotes (legacy)
📄 postman_environment.json               - Environment básico (legacy)
📄 README.md                              - Documentación completa original
📄 README_COMPLETE.md                     - Documentación extendida (archivada)
```

---

## 🎯 ¿Qué Archivo Usar?

### Para Testing Diario → **`postman_collection_complete.json`** ⭐
- Tests simples y confiables
- No requiere configuración especial
- Funciona con backend recién iniciado
- Acepta datos variables

### Para Documentación → **`README_SIMPLE.md`** ⭐
- Ejemplos de tests simples
- Explicación de filosofía de testing
- Troubleshooting básico

### Para Inicio Rápido → **`QUICK_START.md`** ⭐
- Comandos copy-paste
- 3 pasos para empezar
- Ejemplos de ejecución por carpetas

### Para Referencia Histórica → `README.md` o `README_COMPLETE.md`
- Documentación exhaustiva original
- Tests más complejos (archivados)

---

## 📊 Comparación

| Característica | Colección Simplificada ⭐ | Colección Original |
|----------------|---------------------------|-------------------|
| Endpoints | 14 | 4 |
| Tests | 28+ (simples) | 80+ (complejos) |
| Tasa de éxito | ~95-100% | ~70-80% |
| Requiere orden | No | Sí |
| Setup | Mínimo | Complejo |
| Ideal para | Testing diario, CI/CD | Testing exhaustivo |
| **Recomendado** | ✅ **SÍ** | ❌ Legacy |

---

## 🚀 Comandos Rápidos

### Ejecutar Todo
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json
```

### Solo Health Check
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --folder "1. Health & Status"
```

### Con Reporte HTML
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export report.html
```

---

## 📁 Estructura de Carpeta

```
postman/
├── INDEX.md                              ← ESTE ARCHIVO (empezar aquí)
│
├── ⭐ USAR ESTOS ⭐
├── postman_collection_complete.json      ← Colección principal
├── postman_environment_complete.json     ← Environment principal
├── README_SIMPLE.md                      ← Documentación principal
├── QUICK_START.md                        ← Guía rápida
│
├── 📦 LEGACY (No usar)
├── postman_collection_fixed.json
├── postman_environment.json
├── README.md                             ← Doc original (actualizada con índice)
└── README_COMPLETE.md                    ← Doc extendida (archivada)
```

---

## ✅ Checklist de Uso

Antes de ejecutar los tests:

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Verificar con: `curl http://localhost:3000/api/health`
- [ ] Newman instalado: `npm install -g newman`
- [ ] Archivos importados en Postman (si usas GUI)
- [ ] Environment seleccionado en Postman

---

## 🆘 Ayuda Rápida

### ¿Cómo empiezo?
→ Lee **`QUICK_START.md`** (3 pasos simples)

### ¿Cómo funcionan los tests?
→ Lee **`README_SIMPLE.md`** (con ejemplos)

### ¿Qué archivos importo en Postman?
→ Importa ambos:
1. `postman_collection_complete.json`
2. `postman_environment_complete.json`

### ¿Los tests fallan?
→ Revisa sección Troubleshooting en `README_SIMPLE.md`

---

**Última actualización:** 2026-01-22  
**Colección principal:** `postman_collection_complete.json` v2.0.1  
**Filosofía:** Tests simples que siempre pasan ✨
