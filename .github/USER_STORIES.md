---
title: User Stories - Shipping Optimizer
version: 1.0
date_created: 2026-01-06
last_updated: 2026-01-06
---

# User Stories (Historias de Usuario)

Este documento contiene las historias de usuario para el Optimizador de Envíos siguiendo la metodología INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable).

## Epic: Sistema de Comparación de Proveedores de Envío

**Como**  usuario del sistema,
**Quiero** poder comparar diferentes opciones de envío de múltiples proveedores,
**Para** tomar decisiones informadas y optimizar costos y tiempos de entrega.

---

## HU-01: Solicitar Cotización de Envío

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** ingresar los detalles de mi envío (origen, destino, peso, fecha de recolección),
**Para** recibir cotizaciones de todos los proveedores disponibles.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Solicitud exitosa con todos los proveedores disponibles
```gherkin
Given que estoy en la página de cotización
And todos los proveedores (FedEx, DHL, Local) están disponibles
When ingreso los siguientes datos:
  | Campo           | Valor                  |
  | Origen          | "New York, NY"         |
  | Destino         | "Los Angeles, CA"      |
  | Peso            | 5.5 kg                 |
  | Fecha recolección | 2026-01-10          |
  | Frágil          | No                     |
And presiono el botón "Obtener Cotizaciones"
Then debo ver una lista con 3 cotizaciones
And cada cotización debe mostrar: proveedor, precio, días estimados de entrega
And el sistema debe resaltar cuál es la opción más barata
And el sistema debe resaltar cuál es la opción más rápida
And debo ver el tiempo de respuesta del sistema (menos de 3 segundos)
```

#### Escenario 2: Solicitud con peso de paquete frágil
```gherkin
Given que estoy en la página de cotización
When ingreso un envío marcado como "Frágil"
And completo todos los campos requeridos
And presiono "Obtener Cotizaciones"
Then las cotizaciones deben reflejar el cargo adicional por fragilidad
And debo ver un indicador visual que identifica que es un envío frágil
```

#### Escenario 3: Usuario intenta cotizar sin completar todos los campos
```gherkin
Given que estoy en la página de cotización
When dejo uno o más campos requeridos vacíos
Then el botón "Obtener Cotizaciones" debe estar deshabilitado
And debo ver mensajes indicativos debajo de los campos vacíos
```

### Notas de Implementación para TDD
- Validación de campos en el frontend antes de enviar la solicitud
- Manejo de timeouts cuando un proveedor no responde
- Cache de cotizaciones para solicitudes idénticas (5 minutos)

### Valor de Negocio
Permite a los usuarios obtener información comparativa instantánea para tomar decisiones informadas.

---

## HU-02: Validación de Datos de Envío

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** recibir retroalimentación inmediata cuando ingreso datos inválidos,
**Para** corregirlos antes de solicitar cotizaciones y evitar errores.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Validación de peso fuera de rango
```gherkin
Given que estoy ingresando datos de envío
When ingreso un peso menor a 0.1 kg
Then debo ver un mensaje de error: "El peso debe ser mayor a 0.1 kg"
And el campo de peso debe marcarse visualmente como inválido
And el botón "Obtener Cotizaciones" debe estar deshabilitado

When ingreso un peso mayor a 1000 kg
Then debo ver un mensaje de error: "El peso máximo permitido es 1000 kg"
And el campo de peso debe marcarse visualmente como inválido
```

#### Escenario 2: Validación de fecha de recolección
```gherkin
Given que estoy ingresando la fecha de recolección
When selecciono una fecha anterior a hoy
Then debo ver un mensaje: "La fecha no puede ser anterior a hoy"
And el campo de fecha debe marcarse como inválido

When selecciono una fecha más de 30 días en el futuro
Then debo ver un mensaje: "La fecha no puede ser mayor a 30 días"
And el campo de fecha debe marcarse como inválido
```

#### Escenario 3: Validación de direcciones vacías
```gherkin
Given que estoy completando los campos de dirección
When intento dejar el campo de origen vacío
Then debo ver el mensaje: "El origen es requerido"
When intento dejar el campo de destino vacío
Then debo ver el mensaje: "El destino es requerido"
```

### Valor de Negocio
Mejora la experiencia del usuario evitando solicitudes fallidas y reduciendo la carga en el backend.

---

## HU-03: Identificar la Mejor Opción de Envío

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** identificar rápidamente cuál es la opción más económica y cuál es la más rápida,
**Para** tomar una decisión basada en mis prioridades (costo vs. tiempo).

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Identificación visual de la opción más barata
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When el sistema procesa los resultados
Then debe haber exactamente UNA cotización marcada como "Más Barata"
And esta debe tener una insignia visual distintiva (por ejemplo, badge verde con "$")
And debe ser la que tiene el precio más bajo
```

#### Escenario 2: Identificación visual de la opción más rápida
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When el sistema procesa los resultados
Then debe haber exactamente UNA cotización marcada como "Más Rápida"
And esta debe tener una insignia visual distintiva (por ejemplo, badge azul con "⚡")
And debe ser la que tiene el menor tiempo de entrega en días
```

#### Escenario 3: Empate en precios
```gherkin
Given que dos proveedores ofrecen el mismo precio (el más bajo)
When el sistema determina la opción más barata
Then el primer proveedor en la lista debe recibir la insignia "Más Barata"
```

#### Escenario 4: Empate en tiempos de entrega
```gherkin
Given que dos proveedores ofrecen el mismo tiempo de entrega (el más corto)
When el sistema determina la opción más rápida
Then el primer proveedor en la lista debe recibir la insignia "Más Rápida"
```

### Valor de Negocio
Facilita la toma de decisiones al usuario sin requerir análisis manual de datos.

---

## HU-04: Visualizar Estado del Sistema

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** ver el estado de disponibilidad de los proveedores de envío,
**Para** saber qué opciones están activas y tomar decisiones informadas.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Todos los proveedores disponibles
```gherkin
Given que accedo al sistema
When el dashboard se carga
Then debo ver un widget de estado del sistema que muestra "Sistema: EN LÍNEA"
And debo ver un contador que indica "3/3 Proveedores Activos"
And debo ver una tabla con cada proveedor:
  | Proveedor | Estado    | Tiempo de Respuesta |
  | FedEx     | En Línea  | 420ms              |
  | DHL       | En Línea  | 580ms              |
  | Local     | En Línea  | 150ms              |
```

#### Escenario 2: Un proveedor no disponible
```gherkin
Given que uno de los proveedores (por ejemplo, DHL) no responde
When el dashboard se actualiza
Then debo ver el estado del sistema como "Sistema: DEGRADADO"
And el contador debe mostrar "2/3 Proveedores Activos"
And el proveedor DHL debe aparecer con estado "Fuera de Línea"
And debe mostrarse un ícono de advertencia (⚠️)
```

#### Escenario 3: Todos los proveedores no disponibles
```gherkin
Given que ningún proveedor responde
When intento acceder al sistema
Then debo ver el estado del sistema como "Sistema: FUERA DE LÍNEA"
And el contador debe mostrar "0/3 Proveedores Activos"
And debo ver un mensaje: "El servicio no está disponible en este momento. Por favor, intente más tarde."
And no debo poder realizar cotizaciones
```

#### Escenario 4: Actualización automática del estado
```gherkin
Given que estoy viendo el dashboard
When pasan 30 segundos
Then el sistema debe actualizar automáticamente el estado de los proveedores
And debo ver la hora de última actualización
```

### Valor de Negocio
Proporciona transparencia sobre la disponibilidad del servicio y genera confianza en el usuario.

---

## HU-05: Manejar Proveedores No Disponibles

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** recibir cotizaciones de los proveedores disponibles incluso si algunos están fuera de línea,
**Para** poder continuar con mi trabajo sin interrupciones.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Un proveedor no responde (degradación elegante)
```gherkin
Given que FedEx no está disponible (timeout o error)
And DHL y Local están funcionando
When solicito una cotización
Then debo recibir cotizaciones solo de DHL y Local
And debo ver un mensaje informativo: "FedEx no está disponible en este momento"
And el proveedor FedEx debe aparecer en la lista con estado "Fuera de Línea"
And no debe mostrarse precio ni tiempo de entrega para FedEx
```

#### Escenario 2: Dos proveedores disponibles
```gherkin
Given que solo 2 de 3 proveedores están disponibles
When solicito cotizaciones
Then debo ver exactamente 2 cotizaciones válidas
And las insignias "Más Barata" y "Más Rápida" deben asignarse solo entre las opciones disponibles
```

#### Escenario 3: Ningún proveedor disponible
```gherkin
Given que ningún proveedor está disponible
When intento solicitar una cotización
Then debo ver un mensaje de error: "El servicio no está disponible. Por favor, intente nuevamente en unos minutos."
And el sistema debe sugerir un tiempo de reintento (30 segundos)
And no debo ver la lista de cotizaciones
```

### Valor de Negocio
Asegura continuidad del servicio y experiencia positiva incluso con fallos parciales.

---

## HU-06: Ver Historial de Cotizaciones

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** acceder al historial de mis cotizaciones previas,
**Para** comparar precios a lo largo del tiempo o recuperar información de envíos anteriores.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Ver listado de cotizaciones anteriores
```gherkin
Given que he realizado cotizaciones previamente
When accedo a la sección "Historial de Cotizaciones"
Then debo ver una lista de mis cotizaciones pasadas
And cada entrada debe mostrar:
  - Fecha y hora de la cotización
  - Origen y destino
  - Peso del paquete
  - Número de proveedores que respondieron
And la lista debe estar ordenada de más reciente a más antigua
```

#### Escenario 2: Ver detalle de una cotización anterior
```gherkin
Given que estoy viendo el historial de cotizaciones
When selecciono una cotización específica
Then debo ver todos los detalles de esa cotización:
  - Todas las cotizaciones que se recibieron
  - Cuál fue marcada como más barata y más rápida
  - Estado de cada proveedor en ese momento
```

#### Escenario 3: Reutilizar datos de una cotización anterior
```gherkin
Given que estoy viendo el detalle de una cotización anterior
When presiono el botón "Cotizar Nuevamente"
Then el formulario de cotización debe pre-llenarse con los datos de esa cotización
And debo ser redirigido a la página de cotización
And puedo modificar los datos antes de enviar
```

### Valor de Negocio
Permite análisis de tendencias de precios y facilita cotizaciones repetitivas.

---

## HU-07: Filtrar y Ordenar Resultados de Cotizaciones

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** ordenar y filtrar las cotizaciones recibidas,
**Para** encontrar la opción que mejor se ajuste a mis necesidades específicas.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Ordenar por precio
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When selecciono la opción "Ordenar por Precio (Menor a Mayor)"
Then las cotizaciones deben reordenarse mostrando primero la más económica
When selecciono "Ordenar por Precio (Mayor a Menor)"
Then las cotizaciones deben reordenarse mostrando primero la más costosa
```

#### Escenario 2: Ordenar por tiempo de entrega
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When selecciono "Ordenar por Tiempo de Entrega (Más Rápido)"
Then las cotizaciones deben reordenarse mostrando primero la entrega más rápida
When selecciono "Ordenar por Tiempo de Entrega (Más Lento)"
Then las cotizaciones deben reordenarse mostrando primero la entrega más lenta
```

#### Escenario 3: Filtrar por proveedor específico
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When selecciono un filtro "Mostrar solo FedEx"
Then debo ver únicamente las cotizaciones de FedEx
And las insignias "Más Barata" y "Más Rápida" deben recalcularse solo para los resultados visibles
```

#### Escenario 4: Filtrar por rango de precios
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When establezco un rango de precios (ejemplo: $50 - $100)
Then debo ver solo las cotizaciones que están dentro de ese rango
And debo ver un contador: "X resultados encontrados"
```

### Valor de Negocio
Mejora la experiencia del usuario al permitir personalización de la visualización según preferencias.

---

## HU-08: Recibir Notificaciones sobre Cambios en el Estado del Sistema

### Historia de Usuario
**Como** usuario activo del sistema,
**Quiero** ser notificado cuando un proveedor cambia su estado de disponibilidad,
**Para** saber si debo volver a solicitar una cotización o esperar.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Notificación cuando un proveedor cae
```gherkin
Given que estoy usando el sistema
And todos los proveedores están en línea
When un proveedor (por ejemplo, DHL) deja de responder
Then debo ver una notificación en tiempo real: "DHL no está disponible temporalmente"
And la notificación debe desaparecer automáticamente después de 5 segundos
And el widget de estado debe actualizarse inmediatamente
```

#### Escenario 2: Notificación cuando un proveedor se recupera
```gherkin
Given que un proveedor estaba fuera de línea
When el proveedor vuelve a estar disponible
Then debo ver una notificación: "DHL está disponible nuevamente"
And el widget de estado debe actualizarse para reflejar el cambio
```

#### Escenario 3: Notificación de sistema completamente caído
```gherkin
Given que todos los proveedores están fuera de línea
When intento usar el sistema
Then debo ver una notificación prominente: "El servicio está temporalmente no disponible"
And se debe mostrar el tiempo estimado de reintento
```

### Valor de Negocio
Mantiene al usuario informado y reduce frustración por cambios inesperados en la disponibilidad.

---

## HU-09: Comparar Opciones Lado a Lado

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** comparar las cotizaciones en un formato de tabla lado a lado,
**Para** evaluar fácilmente las diferencias entre proveedores.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Vista de comparación estándar
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When presiono el botón "Vista de Comparación"
Then debo ver una tabla con columnas para cada proveedor
And cada columna debe mostrar:
  - Nombre del proveedor
  - Precio
  - Tiempo de entrega (días)
  - Tiempo de respuesta del sistema
  - Insignias (Más Barato / Más Rápido)
And las diferencias de precio deben resaltarse visualmente
```

#### Escenario 2: Destacar diferencias significativas
```gherkin
Given que estoy en la vista de comparación
When hay una diferencia de precio mayor al 20% entre proveedores
Then esa diferencia debe resaltarse con un color distintivo
When hay una diferencia de más de 2 días en el tiempo de entrega
Then esa diferencia debe marcarse visualmente
```

#### Escenario 3: Cambiar entre vistas
```gherkin
Given que estoy en la vista de comparación
When presiono "Vista de Lista"
Then debo volver a ver las cotizaciones en formato de lista
And todas las insignias y filtros deben mantenerse
```

### Valor de Negocio
Facilita la comparación visual y acelera el proceso de toma de decisiones.

---

## HU-10: Exportar Resultados de Cotizaciones

### Historia de Usuario
**Como** gerente de logística,
**Quiero** exportar los resultados de las cotizaciones a un archivo,
**Para** compartir la información con mi equipo o incluirla en reportes.

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Exportar a CSV
```gherkin
Given que he recibido cotizaciones
When presiono el botón "Exportar a CSV"
Then debo descargar un archivo CSV con las siguientes columnas:
  - Proveedor
  - Precio
  - Moneda
  - Días de Entrega
  - Estado
  - Es Más Barato (Sí/No)
  - Es Más Rápido (Sí/No)
  - Fecha de Cotización
And el archivo debe nombrarse con el formato: "cotizacion_YYYYMMDD_HHMMSS.csv"
```

#### Escenario 2: Exportar a JSON
```gherkin
Given que he recibido cotizaciones
When presiono el botón "Exportar a JSON"
Then debo descargar un archivo JSON con la estructura completa de la respuesta
And debe incluir todos los metadatos (requestId, timestamp)
```

#### Escenario 3: Copiar al portapapeles
```gherkin
Given que he recibido cotizaciones
When presiono el botón "Copiar Resumen"
Then el resumen de las cotizaciones debe copiarse al portapapeles en formato texto
And debo ver una confirmación: "Copiado al portapapeles"
```

### Valor de Negocio
Facilita la colaboración y el análisis posterior de datos de cotizaciones.

---

## Resumen de Priorización (Estimación MoSCoW)

### Must Have (Esenciales para MVP)
- HU-01: Solicitar Cotización de Envío
- HU-02: Validación de Datos de Envío
- HU-03: Identificar la Mejor Opción de Envío
- HU-04: Visualizar Estado del Sistema
- HU-05: Manejar Proveedores No Disponibles

### Should Have (Importantes pero no bloqueantes)
- HU-07: Filtrar y Ordenar Resultados de Cotizaciones
- HU-09: Comparar Opciones Lado a Lado

### Could Have (Deseables si hay tiempo)
- HU-06: Ver Historial de Cotizaciones
- HU-08: Recibir Notificaciones sobre Cambios en el Estado del Sistema
- HU-10: Exportar Resultados de Cotizaciones

---

## Métricas de Éxito

- **Tiempo promedio de respuesta del sistema:** < 3 segundos
- **Precisión de insignias (Más Barato/Más Rápido):** 100%
- **Uptime del sistema con al menos 1 proveedor:** > 99%
- **Tasa de error en validaciones:** < 1%
- **Satisfacción del usuario:** > 4/5 estrellas

---

## Notas para el Agente TDD

1. **Orden recomendado de implementación:**
   - Comenzar con HU-02 (validaciones) - son la base
   - Seguir con HU-01 (flujo principal)
   - Implementar HU-03 (lógica de badges)
   - HU-05 (manejo de errores)
   - HU-04 (dashboard)

2. **Tests prioritarios:**
   - Unit tests para lógica de validación (HU-02)
   - Unit tests para lógica de asignación de badges (HU-03)
   - Integration tests para el endpoint POST /quotes (HU-01)
   - E2E tests para el flujo completo de cotización

3. **Edge cases críticos a testear:**
   - Empates en precios y tiempos
   - Timeouts de proveedores individuales
   - Todos los proveedores caídos
   - Pesos extremos (mínimos y máximos)
   - Fechas en límites de validación
   - Envíos frágiles con diferentes pesos

4. **Cobertura esperada:** 70%+ en lógica de negocio (domain y application layers)
