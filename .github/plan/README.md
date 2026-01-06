# Implementation Plans - Index

Este directorio contiene planes de implementación detallados por historia de usuario, basados en [plan-template.md](../../../../.github/templates/plan-template.md).

---

## 📋 Planes Disponibles

### Must-Have (MVP Core Features)

| Plan | HU | Descripción | Estado |
|:---|:---|:---|:---|
| [HU-01-quote-request.md](HU-01-quote-request.md) | HU-01 | Solicitar cotizaciones de múltiples proveedores | ⬜ No iniciado |
| [HU-02-input-validation.md](HU-02-input-validation.md) | HU-02 | Validación de datos de envío (peso, fecha, direcciones) | ⬜ No iniciado |
| [HU-03-badge-assignment.md](HU-03-badge-assignment.md) | HU-03 | Identificar opción más barata/rápida con badges | ⬜ No iniciado |
| [HU-04-system-health.md](HU-04-system-health.md) | HU-04 | Visualizar estado de proveedores y sistema | ⬜ No iniciado |
| [HU-05-error-handling.md](HU-05-error-handling.md) | HU-05 | Manejar proveedores no disponibles (graceful degradation) | ⬜ No iniciado |

### Should-Have (Importante pero no bloqueante)

| Plan | HU | Descripción | Estado |
|:---|:---|:---|:---|
| _Pendiente_ | HU-07 | Filtrar y ordenar resultados de cotizaciones | 📝 Por crear |
| _Pendiente_ | HU-09 | Comparar opciones lado a lado | 📝 Por crear |

### Could-Have (Deseable si hay tiempo)

| Plan | HU | Descripción | Estado |
|:---|:---|:---|:---|
| _Pendiente_ | HU-06 | Ver historial de cotizaciones | 📝 Por crear |
| _Pendiente_ | HU-08 | Recibir notificaciones sobre cambios | 📝 Por crear |
| _Pendiente_ | HU-10 | Exportar resultados de cotizaciones | 📝 Por crear |

---

## 🎯 Orden de Implementación Recomendado

1. **HU-02** (Validación) - Base fundamental, sin dependencias
2. **HU-01** (Quote Request) - Funcionalidad core
3. **HU-03** (Badges) - Mejora UX de HU-01
4. **HU-05** (Error Handling) - Resiliencia del sistema
5. **HU-04** (System Health) - Visibilidad del estado

---

## 📝 Cómo Crear un Nuevo Plan

### Opción 1: Copiar Template

```bash
cd plan/
cp ../../../../.github/templates/plan-template.md HU-XX-feature-name.md
# Editar HU-XX-feature-name.md con detalles específicos
```

### Opción 2: Usar Copilot

```
Prompt para Copilot Chat:
"Crea un plan de implementación para HU-XX siguiendo:
- Template: #file:../../../../.github/templates/plan-template.md
- User Story: #file:../USER_STORIES.md (HU-XX)
- Arquitectura: #file:../ARCHITECTURE.md
- Ejemplo: #file:HU-01-quote-request.md"
```

---

## 📊 Estructura de un Plan

Cada plan contiene:

1. **Title & Metadata** - Título, versión, fechas
2. **User Story Reference** - Link a USER_STORIES.md
3. **Architecture and Design** - Componentes involucrados, patrones
4. **Tasks** - Lista detallada de tareas con checkboxes
5. **Open Questions** - Decisiones pendientes
6. **Acceptance Criteria** - Escenarios Gherkin de USER_STORIES.md
7. **Success Metrics** - KPIs y métricas de éxito
8. **Dependencies** - Qué requiere y qué bloquea
9. **Related Documentation** - Links a otros documentos

---

## 🔗 Referencias

- **Master Plan:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Vista general de todos los sprints
- **User Stories:** [USER_STORIES.md](../USER_STORIES.md) - Historias de usuario completas
- **Test Guide:** [TDD_GUIDE.md](../TDD_GUIDE.md) - Ejemplos de tests por HU
- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md) - Diseño del sistema

---

## ✅ Convenciones

### Estados de Planes

- ⬜ **No iniciado** - Plan creado pero implementación no comenzada
- 🚧 **En progreso** - Implementación activa
- ✅ **Completado** - Todas las tareas completadas y tests pasando
- 📝 **Por crear** - Plan aún no existe

### Nomenclatura de Archivos

```
HU-[número]-[descripción-breve].md

Ejemplos:
- HU-01-quote-request.md
- HU-02-input-validation.md
- HU-03-badge-assignment.md
```

### Actualización de Estado

Actualiza este README.md cuando:
- Se completa un plan (cambiar ⬜ → ✅)
- Se inicia trabajo en un plan (cambiar ⬜ → 🚧)
- Se crea un nuevo plan (cambiar 📝 → ⬜)

---

**Última actualización:** 2026-01-06
**Planes creados:** 5/10
**Planes completados:** 0/10
