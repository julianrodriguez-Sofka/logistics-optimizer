# 🤖 GitHub Copilot - Guía de Uso con Contexto

Esta guía explica **cómo funciona realmente** el contexto en GitHub Copilot y cómo aprovechar al máximo la documentación del proyecto.

---

## 🔍 Realidad: ¿Qué Lee Copilot Automáticamente?

### ✅ GitHub Copilot Chat (Panel de Chat)

**Lee automáticamente:**
```
✅ .github/copilot-instructions.md
   ↓ Este archivo SE LEE sin que lo pidas
   ↓ Por eso funciona como "índice" del proyecto
```

**NO lee automáticamente (necesitas referenciarlo):**
```
❌ USER_STORIES.md
❌ ARCHITECTURE.md
❌ IMPLEMENTATION_PLAN.md
❌ TDD_GUIDE.md
❌ PRODUCT.md

✅ Para usarlos, escribe: #file:ARCHITECTURE.md
```

### ❌ GitHub Copilot Autocompletado (En el editor)

**NO lee ningún archivo de documentación.**

Solo usa:
- Archivo actual que editas
- Archivos abiertos en pestañas
- Contexto local del código

---

## 📝 Ejemplos Prácticos de Uso

### Ejemplo 1: Implementar una Nueva User Story

**❌ MALO (sin contexto):**
```
Tú: "Implementa HU-01"

Copilot: "¿Qué es HU-01? No tengo contexto sobre tus historias de usuario."
```

**✅ BUENO (con contexto):**
```
Tú: "Implementa HU-01 siguiendo:
- User story: #file:USER_STORIES.md (HU-01: Solicitar Cotización de Envío)
- Arquitectura: #file:ARCHITECTURE.md
- Guía de tests: #file:TDD_GUIDE.md"

Copilot: [Lee los 3 archivos]
"Voy a implementar HU-01. Según USER_STORIES.md, necesito:
1. Crear endpoint POST /api/quotes
2. Validar input (origen, destino, peso, fecha)
3. Llamar a los 3 adapters...
Comenzaré escribiendo los tests según TDD_GUIDE.md..."
```

---

### Ejemplo 2: Crear un Nuevo Adapter

**❌ MALO:**
```
Tú: "Crea el FedExAdapter"

Copilot: "Aquí está un adaptador genérico..." [código que no sigue tus patrones]
```

**✅ BUENO:**
```
Tú: "Crea el FedExAdapter siguiendo:
- Interface: #file:ARCHITECTURE.md (IShippingProvider)
- Validación: #file:ARCHITECTURE.md (Data Contracts)
- Tests: #file:TDD_GUIDE.md (sección de adapters)
- Debe implementar timeout de 5 segundos según #file:PRODUCT.md"

Copilot: [Lee la arquitectura y produce código consistente con tu proyecto]
```

---

### Ejemplo 3: Escribir Tests

**✅ MEJOR FORMA:**
```
Tú: "Escribe tests para validación de peso según:
- Reglas: #file:ARCHITECTURE.md (Edge Cases & Validation Rules)
- Ejemplos: #file:TDD_GUIDE.md (HU-02 Test Checklist)
- Criterios: #file:USER_STORIES.md (HU-02 escenario 1)"

Copilot: [Genera tests siguiendo tus patrones exactos]
```

---

### Ejemplo 4: Usar el Agente TDD

**✅ Invocación correcta:**
```
Tú: "Usa el agente TDD para implementar HU-02:
#file:../../../.github/agents/tdd.agent.md

Contexto del proyecto:
- User story: #file:USER_STORIES.md (HU-02)
- Arquitectura: #file:ARCHITECTURE.md
- Plan: #file:IMPLEMENTATION_PLAN.md (Sprint 1, Task 1.2)"

Copilot: [Sigue el workflow RED-GREEN-REFACTOR del agente]
```

---

## 🎯 copilot-instructions.md - Tu "Índice Automático"

El archivo `.github/copilot-instructions.md` es especial porque **SÍ se lee automáticamente**.

### Estrategia Óptima:

Úsalo como **índice inteligente** que guía a Copilot:

```markdown
# Copilot Instructions

## Quick Reference
- Arquitectura: #file:ARCHITECTURE.md
- User Stories: #file:USER_STORIES.md
- Tests: #file:TDD_GUIDE.md

## Cuando necesites X, referencia Y:
- Crear adapter → #file:ARCHITECTURE.md (IShippingProvider)
- Escribir tests → #file:TDD_GUIDE.md
- Validar input → #file:PRODUCT.md
```

**Beneficio:** Cuando chateas, Copilot ya sabe dónde buscar información.

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Abre archivos relevantes en pestañas

```
[Pestaña 1] USER_STORIES.md
[Pestaña 2] ARCHITECTURE.md
[Pestaña 3] TDD_GUIDE.md
[Pestaña 4] Archivo que vas a editar
```

**Beneficio:** Copilot tiene más contexto visual.

### 2. Usa Copilot Chat con referencias explícitas

```
Copilot Chat:
"Implementa la función calculateQuote() siguiendo:
- Interface: #file:ARCHITECTURE.md (líneas 45-60)
- Tests: #file:TDD_GUIDE.md (líneas 120-150)
- Validación: #file:PRODUCT.md"
```

### 3. Valida contra la documentación

```
Después de generar código:
"Verifica que esto cumple con:
- SOLID principles en #file:ARCHITECTURE.md
- Acceptance criteria en #file:USER_STORIES.md (HU-01)"
```

---

## 📊 Tabla de Referencia Rápida

| Tarea | Archivo(s) a Referenciar | Comando |
|:---|:---|:---|
| Implementar HU | USER_STORIES.md + IMPLEMENTATION_PLAN.md | `#file:USER_STORIES.md` |
| Crear adapter | ARCHITECTURE.md (interfaces) | `#file:ARCHITECTURE.md` |
| Escribir tests | TDD_GUIDE.md + USER_STORIES.md | `#file:TDD_GUIDE.md` |
| Validar input | ARCHITECTURE.md + PRODUCT.md | `#file:ARCHITECTURE.md` |
| API endpoints | PRODUCT.md (API contract) | `#file:PRODUCT.md` |
| Plan individual HU | Workspace template | `#file:../../../.github/templates/plan-template.md` |
| TDD workflow | Workspace agent | `#file:../../../.github/agents/tdd.agent.md` |

---

## 💡 Tips Pro

### Tip 1: Contexto Progresivo
```
Primero: "Lee la arquitectura: #file:ARCHITECTURE.md"
Luego:   "Ahora implementa siguiendo eso + #file:USER_STORIES.md HU-01"
```

### Tip 2: Especifica Secciones
```
"Usa las validation rules de #file:ARCHITECTURE.md 
 (sección 'Edge Cases & Validation Rules')"
```

### Tip 3: Combina Múltiples Archivos
```
"Genera tests que:
- Cumplan con #file:USER_STORIES.md (HU-02, escenario 1)
- Usen ejemplos de #file:TDD_GUIDE.md
- Validen según #file:ARCHITECTURE.md (Data Contracts)"
```

### Tip 4: Usa Rangos de Líneas
```
"Implementa según #file:ARCHITECTURE.md:45-80"
```

### Tip 5: Reutiliza Contexto
```
Mensaje 1: "Lee estos archivos: #file:A.md #file:B.md #file:C.md"
Mensaje 2: "Basándote en lo anterior, implementa X"
Mensaje 3: "Ahora agrega tests basándote en el mismo contexto"
```

---

## 🚨 Errores Comunes

### ❌ Error 1: Asumir que Copilot "sabe" sin decirle
```
❌ "Implementa HU-01"
✅ "Implementa HU-01 (#file:USER_STORIES.md)"
```

### ❌ Error 2: No especificar qué parte del archivo
```
❌ "#file:ARCHITECTURE.md"
✅ "#file:ARCHITECTURE.md (sección IShippingProvider interface)"
```

### ❌ Error 3: Referenciar archivos que no existen
```
❌ "#file:REQUIREMENTS.md" (eliminado)
✅ "#file:ARCHITECTURE.md (Data Contracts)"
```

### ❌ Error 4: No usar copilot-instructions.md como índice
```
❌ Dejar copilot-instructions.md vacío
✅ Usar como índice con referencias a otros archivos
```

---

## 🎓 Entrenando a Copilot

Copilot aprende de tus conversaciones en la sesión actual.

**Estrategia de "Entrenamiento":**

```
Conversación 1 (inicio de sesión):
"Para este proyecto, siempre usa:
- Arquitectura: #file:ARCHITECTURE.md
- User Stories: #file:USER_STORIES.md
- Tests: #file:TDD_GUIDE.md
¿Entendido?"

Copilot: "Entendido. Usaré esos archivos como referencia..."

Conversación 2+:
"Implementa HU-02" ← Copilot ya tiene contexto de conversación previa
```

---

## 📱 Atajos Útiles en VS Code

```
Ctrl + I        → Abre Copilot inline chat
Ctrl + Shift + I → Abre Copilot panel lateral
@workspace      → Busca en todo el workspace
#file:          → Referencia archivo específico
/explain        → Explica código seleccionado
/tests          → Genera tests para código seleccionado
/fix            → Sugiere fix para error
```

---

## 🔧 Configuración Recomendada (settings.json)

```json
{
  "github.copilot.enable": {
    "*": true,
    "markdown": true
  },
  "github.copilot.advanced": {
    "inlineSuggestCount": 3
  },
  "files.associations": {
    "*.md": "markdown"
  }
}
```

---

## ✅ Checklist para Máximo Contexto

Antes de pedirle algo a Copilot:

```
[ ] ¿Tengo copilot-instructions.md actualizado como índice?
[ ] ¿Tengo los archivos relevantes abiertos en pestañas?
[ ] ¿Estoy usando #file: para referenciar documentación?
[ ] ¿Especifiqué qué sección del archivo necesito?
[ ] ¿Di contexto sobre qué tarea estoy realizando?
[ ] ¿Mencioné qué user story o sprint estoy trabajando?
```

---

## 🎯 Ejemplo Completo de Sesión Ideal

```
=== Inicio de sesión de desarrollo ===

Tú: "Voy a implementar HU-02 (Validación de Datos). 
     Contexto del proyecto:
     - Arquitectura: #file:ARCHITECTURE.md
     - User story: #file:USER_STORIES.md (HU-02)
     - Plan: #file:IMPLEMENTATION_PLAN.md (Sprint 1, Task 1.2)
     - Guía TDD: #file:TDD_GUIDE.md
     
     Usaremos TDD siguiendo: #file:../../../.github/agents/tdd.agent.md"

Copilot: "Perfecto. Veo que HU-02 requiere validación de peso, fechas y direcciones..."

Tú: "Correcto. Empecemos con tests RED. Genera tests para validación de peso
     siguiendo ejemplos de #file:TDD_GUIDE.md (HU-02 Test Checklist)"

Copilot: [Genera tests siguiendo tus patrones exactos]

Tú: "Ahora implementa la clase QuoteRequest que haga pasar estos tests,
     cumpliendo con las validation rules de #file:ARCHITECTURE.md"

Copilot: [Genera implementación correcta]

Tú: "Verifica que cumple SOLID principles de #file:ARCHITECTURE.md"

Copilot: "Sí, cumple con Single Responsibility..."
```

---

**Resumen:** 
- ✅ **copilot-instructions.md** se lee automáticamente (úsalo como índice)
- ❌ **Otros archivos** requieren `#file:` explícito
- 🎯 **Siempre proporciona contexto** al chatear con Copilot
- 📚 **Referencia múltiples archivos** para mejor contexto

---

**Última actualización:** 2026-01-06
**Versión:** 1.0
