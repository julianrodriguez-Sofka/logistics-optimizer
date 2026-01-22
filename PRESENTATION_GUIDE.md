# Guía de Presentación — Logistics Shipping Optimizer (20 minutos)

Objetivo: guiarte paso a paso para una exposición de 20 minutos clara, técnica y demostrativa sobre el proyecto.

**Resumen del proyecto (30s)**
- Breve: sistema que compara cotizaciones de múltiples proveedores (FedEx, DHL, Local), calcula rutas (OpenRouteService), cachea resultados y presenta UI interactiva con mapa.

---

## Estructura del tiempo (20 minutos)

Min 0-2 — Contexto y Desafío de Negocio
- Qué problema resolvemos: comparar tarifas en tiempo real y optimizar coste/tiempo para envíos.
- Audiencia objetivo y métricas de éxito (tiempo de respuesta, coste, robustez).
- Mensaje clave: valor para el negocio en 2 frases.

Min 2-10 — Deep Dive de Ingeniería (núcleo)
- 2–3 min: Arquitectura general (diagrama verbal): frontend React ↔ backend Express ↔ MongoDB ↔ Adapters (providers + OpenRouteService).
  - Referencias de código clave:
    - Backend: [logistics-back/src/app.ts](logistics-back/src/app.ts), [logistics-back/src/index.ts](logistics-back/src/index.ts)
    - Adapters: [logistics-back/src/infrastructure/adapters/BaseShippingAdapter.ts](logistics-back/src/infrastructure/adapters/BaseShippingAdapter.ts), [logistics-back/src/infrastructure/adapters/FedExAdapter.ts](logistics-back/src/infrastructure/adapters/FedExAdapter.ts)
    - Interfaz: [logistics-back/src/domain/interfaces/IShippingProvider.ts](logistics-back/src/domain/interfaces/IShippingProvider.ts)
    - OpenRouteService: [logistics-back/src/infrastructure/adapters/OpenRouteServiceAdapter.ts](logistics-back/src/infrastructure/adapters/OpenRouteServiceAdapter.ts)
    - Frontend: [logistics-front/src/main.tsx](logistics-front/src/main.tsx), [logistics-front/src/components/RouteMap.tsx](logistics-front/src/components/RouteMap.tsx)
- 3–4 min: Patrones y decisiones clave
  - Template Method para adapters (evitar duplicación): explicar `BaseShippingAdapter` + hooks.
  - Repository + Singleton para caching y DB (`IQuoteRepository`, `DatabaseService`).
  - Dependency Injection para inyectar providers en `QuoteService`.
- 1–2 min: Flujos críticos y SLAs
  - Cache TTL (5 min backend, ORS cache 1h), timeouts y concurrencia (llamadas a providers en paralelo).
  - Fallos tolerados: cómo se manejan timeouts y degradación (badges y mensajes de proveedor).

Min 10-14 — Cultura DevOps y Calidad (Pruebas)
- Qué mostrar en 3–4 min:
  - Tests unitarios y coverage (backend: `npm test`, `npm run test:coverage`). Cobertura objetivo >80%.
  - Frontend tests con Vitest (`logistics-front`): `npm test`.
  - E2E: carpeta `e2e-tests` (Playwright). Comando: `cd e2e-tests && npm install && npx playwright test`.
  - CI: mencionar workflow (GitHub Actions) que ejecuta tests y builds.
- Artefactos a señalar:
  - Cobertura backend en `logistics-back/coverage` (index.html)
  - Reportes E2E en `e2e-tests/playwright-report`

Min 14-17 — Demo en Vivo (3 minutos)
- Preparación (antes de empezar la charla): preferible ejecutar `docker-compose up -d` o arrancar backend+frontend localmente.
- Flujo corto recomendado (60–90s):
  1. Abrir frontend: http://localhost:5173 — mostrar formulario de cotización.
  2. Solicitar cotización (rellenar origen/destino y peso). Enseñar:
     - Llamada al backend: `GET http://localhost:3000/api/quotes` (o flujo de UI).
     - Resultados: badges de cheapest/fastest, precios y tiempos de entrega.
     - Hacer zoom en el mapa y mostrar polylines multi-modal.
  3. Abrir logs del backend (tail de logs) o mostrar request en DevTools para evidenciar llamadas a adapters y cache hit/miss.
- Comandos útiles (para preparar demo):

```powershell
# Desde la raíz del repo
docker-compose up -d
# Alternativa (local)
cd logistics-back
npm install
npm run dev
# En otra terminal
cd logistics-front
npm install
npm run dev
``` 

Min 17-20 — Aprendizajes y Conclusiones (AI Collaboration Log)
- 2–3 min: aprendizajes técnicos y organizativos
  - Por qué se escogió Template Method frente a Adapter en el ejercicio (explicar la diferencia y la decisión práctica).
  - Mejores prácticas aplicadas: SOLID, separación de capas, tests, cache y fallbacks.
- 30–60s: AI Collaboration Log
  - Mencionar que se documentaron decisiones y correcciones asistidas por IA (ver sección "AI Collaboration Log" en el README principal).
  - Enfatizar validaciones y refactorizaciones impulsadas por análisis automatizado.
- Cierre (30s): próximos pasos recomendados (monitorización, rate-limiting, métricas de negocio).

---

## Checklist rápido previo a la exposición (hacer en los minutos previos)
- [ ] Ejecutar `docker-compose up -d` y verificar servicios.
- [ ] Abrir `http://localhost:5173` (frontend) y `http://localhost:3000/api/health` (backend health).
- [ ] Tener terminal con `docker-compose logs -f backend` listo.
- [ ] Tener navegador con DevTools para mostrar requests.
- [ ] Abrir cobertura e2e/playwright report si quieres mostrar pruebas.

## Preguntas esperadas y respuestas breves
- ¿Por qué Template Method? — Reduce duplicación cuando implementas providers simulados desde cero; Adapter sería para traducir APIs externas.
- ¿Cómo escalar? — Escalar adapters horizontalmente, usar cache distribuido (Redis), añadir rate-limiting y observabilidad (Prometheus/Grafana).
- ¿Fallos en providers externos? — Timeouts, retries, y degradación graciosa con mensajes al cliente.

---

## Recursos y rutas en el repo
- README principal: [logistics-optimizer/README.md](README.md)
- Backend entry: [logistics-back/src/app.ts](logistics-back/src/app.ts)
- Frontend entry: [logistics-front/src/main.tsx](logistics-front/src/main.tsx)
- Adapters: [logistics-back/src/infrastructure/adapters/](logistics-back/src/infrastructure/adapters/)
- Tests backend: [logistics-back](logistics-back)
- E2E tests: [e2e-tests](e2e-tests)

---

Si quieres, puedo adaptar esta guía a una diapositiva por minuto (20 diapositivas) o generar notas del orador para cada slide. 
