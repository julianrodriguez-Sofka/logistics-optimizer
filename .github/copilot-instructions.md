# Engineering Rules: Logistics Shipping Optimizer

## 🛠 Tech Stack & Patterns
- **Backend:** Node.js (TypeScript) + Express. Clean Architecture.
- **Frontend:** React 19 (TypeScript) + Vite.
- **Patterns:** Template Method (Adapters), Repository Pattern (Persistence).
- **Standards:** SOLID, TDD (80%+ coverage), SonarCloud Clean Code.

## 🎯 SonarCloud & Quality Guardrails (CRITICAL)
Antes de generar código, verifica estos puntos para evitar fallos en el Quality Gate:
1. **Cognitive Complexity:** Máximo 10 por función. Si es mayor, extrae a métodos privados.
2. **Duplicación:** Prohibidos los "Magic Strings". Usa constantes en `BaseShippingAdapter` o en archivos de configuración.
3. **Seguridad:** - No usar `any`. Tipado estricto en TS 5.9.
   - Validar inputs en middlewares y en el `BaseShippingAdapter.validateShippingRequest`.
4. **Mantenibilidad:** - No dejes bloques `catch` vacíos o logs genéricos.
   - Elimina código comentado y tags `TODO`.
   - Funciones y métodos deben tener tipos de retorno explícitos.

## 🏗 Backend Architecture Rules
- **Entities:** En `domain/entities/`. Deben ser clases puras.
- **Adapters:** Deben extender de `BaseShippingAdapter` e implementar `calculateShipping`.
- **Services:** La lógica de negocio (como `BadgeService`) debe ser independiente de los frameworks.
- **Persistence:** Usa la interfaz `IQuoteRepository`. No instancies Mongoose directamente en los servicios.

## 🧪 Testing Workflow (TDD)
- **Unitarios:** Jest (Back) / Vitest (Front). Estructura `__tests__/unit/`.
- **Integración:** MongoDB Memory Server para tests de repositorios y rutas.
- **Regla:** Escribe primero el test (Red-Green-Refactor).

## 📝 Reference Files (Context)
Si necesitas detalles profundos, pide leer:
- `#file:ARCHITECTURE.md` (Patrones y validaciones)
- `#file:PRODUCT.md` (Contratos de API y formatos JSON)