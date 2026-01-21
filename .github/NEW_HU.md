---
title: Nuevas Historias de Usuario - Logistics Optimizer v2.0
version: 2.0
date_created: 2026-01-20
last_updated: 2026-01-20
---

# Nuevas Historias de Usuario (HU-11 a HU-16)

Este documento contiene las historias de usuario para las nuevas funcionalidades implementadas en el Logistics Optimizer v2.0 siguiendo la metodología **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable).

---

## Epic: Sistema Integrado de Gestión de Envíos

**Como** operador logístico,
**Quiero** un sistema completo para crear, visualizar y gestionar envíos con mapas interactivos,
**Para** optimizar las operaciones de mi centro de distribución y mejorar la experiencia del cliente.

---

## 🗺️ HU-11: Visualización de Rutas en Mapa Interactivo

### Historia de Usuario
**Como** usuario del sistema,
**Quiero** visualizar la ruta de mi envío en un mapa interactivo,
**Para** entender el trayecto, distancia y tiempo estimado de entrega.

### Criterios INVEST

| Criterio | Cumplimiento |
|----------|--------------|
| **I**ndependent | ✅ Puede implementarse sin depender de otras HU nuevas |
| **N**egotiable | ✅ Detalles del mapa (estilo, marcadores) son negociables |
| **V**aluable | ✅ Proporciona información visual crucial para el usuario |
| **E**stimable | ✅ ~5 story points (integración API + componente React) |
| **S**mall | ✅ Alcanzable en un sprint |
| **T**estable | ✅ Criterios de aceptación verificables |

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Visualizar ruta con coordenadas válidas
```gherkin
Given que he solicitado una cotización válida
And el origen es "Bogotá, Colombia"
And el destino es "Medellín, Colombia"
When se muestra el mapa de la ruta
Then debo ver un mapa interactivo con OpenStreetMap
And debo ver un marcador en el punto de origen
And debo ver un marcador en el punto de destino
And debo ver una línea de ruta conectando ambos puntos
And debo ver la distancia total en kilómetros
And debo ver el tiempo estimado de viaje
```

#### Escenario 2: Ruta multi-modal (avión + camión)
```gherkin
Given que la ruta calculada incluye múltiples modos de transporte
When se muestra el mapa
Then debo ver segmentos diferenciados por color:
  | Modo       | Color    | Estilo        |
  | Terrestre  | #FF9800  | Línea sólida  |
  | Aéreo      | #2196F3  | Línea punteada|
And debo ver un marcador de aeropuerto en puntos de transbordo
And cada segmento debe mostrar su distancia y duración al hacer hover
```

#### Escenario 3: Ajuste automático de zoom
```gherkin
Given que se ha cargado el mapa con una ruta
When la ruta está completamente renderizada
Then el mapa debe ajustar automáticamente el zoom
And ambos marcadores (origen y destino) deben ser visibles
And debe haber un padding de 50px alrededor de la ruta
```

#### Escenario 4: Información de transporte
```gherkin
Given que estoy viendo el mapa de una ruta
When observo el panel de información
Then debo ver el modo de transporte (Camión, Avión, etc.)
And debo ver un icono representativo del modo
And debo ver el texto "Mapa proporcionado por OpenStreetMap • Rutas por OpenRouteService"
```

### Notas Técnicas para TDD
- Componente: `RouteMap.tsx`
- Librería: Leaflet + react-leaflet
- API: OpenRouteService para cálculo de rutas
- Testing: Mock de APIs externas, verificar renderizado de marcadores

---

## 📝 HU-12: Formulario Wizard de Creación de Envíos

### Historia de Usuario
**Como** cliente del sistema,
**Quiero** crear un envío paso a paso con validación en tiempo real,
**Para** completar el proceso de forma guiada y sin errores.

### Criterios INVEST

| Criterio | Cumplimiento |
|----------|--------------|
| **I**ndependent | ✅ Funcionalidad autocontenida |
| **N**egotiable | ✅ Número de pasos y campos son negociables |
| **V**aluable | ✅ Mejora significativa en UX de creación de envíos |
| **E**stimable | ✅ ~8 story points |
| **S**mall | ✅ Alcanzable en un sprint |
| **T**estable | ✅ Cada paso tiene criterios verificables |

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Flujo completo del wizard (5 pasos)
```gherkin
Given que inicio el proceso de crear un envío
When navego por el wizard
Then debo ver los siguientes pasos:
  | Paso | Nombre       | Icono |
  | 1    | Direcciones  | 📍    |
  | 2    | Cotizaciones | 💰    |
  | 3    | Cliente      | 👤    |
  | 4    | Pago         | 💳    |
  | 5    | Confirmación | ✅    |
And debo ver un indicador de progreso visual
And el paso actual debe estar resaltado
```

#### Escenario 2: Paso 1 - Información del Envío
```gherkin
Given que estoy en el paso 1 (Direcciones)
When completo los campos:
  | Campo          | Valor                |
  | Origen         | Bogotá, Colombia     |
  | Destino        | Cali, Colombia       |
  | Peso           | 5.5 kg               |
  | Fecha Recogida | 2026-02-01           |
  | Frágil         | Sí                   |
And presiono "Obtener Cotizaciones"
Then el sistema debe validar todos los campos
And debo avanzar al paso 2 con las cotizaciones cargadas
```

#### Escenario 3: Paso 2 - Selección de Cotización
```gherkin
Given que estoy en el paso 2 (Cotizaciones)
And veo las cotizaciones disponibles de los proveedores
When selecciono una cotización
Then la cotización seleccionada debe resaltarse visualmente
And debo ver el precio, tiempo de entrega y proveedor
And debo poder avanzar al paso 3
```

#### Escenario 4: Paso 3 - Datos del Cliente
```gherkin
Given que estoy en el paso 3 (Cliente)
When completo los datos del remitente:
  | Campo            | Valor                |
  | Nombre           | Juan Pérez           |
  | Email            | juan@email.com       |
  | Teléfono         | 3001234567           |
  | Tipo Documento   | CC                   |
  | Número Documento | 1234567890           |
  | Dirección        | Calle 123 #45-67     |
And completo los datos del destinatario
And opcionalmente agrego una descripción del paquete
Then todos los campos deben validarse en tiempo real
And debo poder avanzar al paso 4
```

#### Escenario 5: Paso 4 - Método de Pago
```gherkin
Given que estoy en el paso 4 (Pago)
When selecciono "Tarjeta de Crédito"
Then debo ver campos para:
  | Campo              | Validación           |
  | Número de Tarjeta  | Algoritmo de Luhn    |
  | Nombre en Tarjeta  | Solo letras y espacios|
  | Fecha Expiración   | MM/YY futuro         |
  | CVV                | 3-4 dígitos          |
And el botón "Confirmar Pago" debe estar deshabilitado hasta validar todo
```

#### Escenario 6: Paso 4 - Pago en Efectivo
```gherkin
Given que estoy en el paso 4 (Pago)
When selecciono "Efectivo (Contra Entrega)"
Then NO debo ver campos de tarjeta
And debo ver el mensaje "El pago se realizará al momento de la entrega"
And debo poder confirmar el pedido directamente
```

#### Escenario 7: Paso 5 - Confirmación
```gherkin
Given que he completado el pago exitosamente
When llego al paso 5 (Confirmación)
Then debo ver:
  - Un ícono de éxito (checkmark verde)
  - El mensaje "✅ ¡Envío Creado Exitosamente!"
  - El número de seguimiento destacado
  - Resumen del remitente y destinatario
  - Detalles del proveedor y método de pago
And debo poder imprimir el comprobante
And debo poder crear otro envío
```

#### Escenario 8: Navegación hacia atrás
```gherkin
Given que estoy en cualquier paso mayor a 1
When presiono el botón "Volver"
Then debo regresar al paso anterior
And mis datos ingresados deben mantenerse
And no debe perderse información
```

### Notas Técnicas para TDD
- Componente principal: `ShipmentWizard.tsx`
- Sub-componentes: `QuoteRequestForm`, `ShipmentDetailsForm`, `PaymentForm`
- Estado: useState para paso actual y datos de cada paso
- Validación: Hooks personalizados con debouncing

---

## 💳 HU-13: Procesamiento de Pago con Animación

### Historia de Usuario
**Como** cliente del sistema,
**Quiero** ver una animación profesional mientras se procesa mi pago,
**Para** sentir confianza de que la transacción está siendo procesada correctamente.

### Criterios INVEST

| Criterio | Cumplimiento |
|----------|--------------|
| **I**ndependent | ✅ Modal independiente del wizard |
| **N**egotiable | ✅ Mensajes y duración de animación negociables |
| **V**aluable | ✅ Mejora significativa en UX y percepción de seguridad |
| **E**stimable | ✅ ~3 story points |
| **S**mall | ✅ Componente pequeño y enfocado |
| **T**estable | ✅ Estados y transiciones verificables |

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Animación de pago con tarjeta
```gherkin
Given que confirmo el pago con tarjeta de crédito
When se muestra el modal de procesamiento
Then debo ver las siguientes etapas secuencialmente:
  | Etapa | Mensaje                              | Icono |
  | 1     | Validando datos de la tarjeta...     | 🔐    |
  | 2     | Conectando con el banco...           | 🏦    |
  | 3     | Confirmando transacción...           | ✓     |
  | 4     | Generando factura electrónica...     | 📄    |
And cada etapa debe tener una duración aproximada de 1-1.5 segundos
And debo ver un spinner animado durante el proceso
And debo ver el monto a pagar
And debo ver indicadores de progreso (dots)
```

#### Escenario 2: Animación de pago en efectivo
```gherkin
Given que confirmo el pago en efectivo
When se muestra el modal de procesamiento
Then debo ver las siguientes etapas:
  | Etapa | Mensaje                              | Icono |
  | 1     | Verificando pedido...                | 📋    |
  | 2     | Registrando pago en efectivo...      | 💵    |
  | 3     | Generando factura electrónica...     | 📄    |
And el mensaje final debe ser "¡Pedido Confirmado!"
And debe indicar que el pago se realizará al momento de la entrega
```

#### Escenario 3: Estado de éxito con factura
```gherkin
Given que el procesamiento ha completado todas las etapas
When se muestra el estado de éxito
Then debo ver:
  - Un ícono de checkmark verde animado
  - El mensaje "¡Pago Exitoso!" o "¡Pedido Confirmado!"
  - Los detalles de la factura:
    | Campo            | Ejemplo                |
    | Número           | FAC-202601-1234        |
    | Fecha            | 20 de enero de 2026    |
    | Hora             | 14:35                  |
    | Método           | Tarjeta/Efectivo       |
    | Total            | $125,000 COP           |
And debo poder presionar "Continuar" para cerrar el modal
```

#### Escenario 4: Prevención de cierre accidental
```gherkin
Given que el pago está siendo procesado
When intento cerrar el modal o actualizar la página
Then debo ver el mensaje "Por favor no cierre esta ventana ni actualice la página"
And el modal NO debe poder cerrarse durante el procesamiento
```

### Notas Técnicas para TDD
- Componente: `PaymentProcessingModal.tsx`
- Patrón: State Machine para gestionar etapas
- Animaciones: CSS animations (@keyframes)
- Testing: Verificar transiciones de estado y tiempos

---

## 🏭 HU-14: Sistema de Gestión de Almacén

### Historia de Usuario
**Como** operador de almacén,
**Quiero** gestionar todos los envíos desde un panel centralizado,
**Para** controlar el estado de cada paquete y asignar recursos de transporte.

### Criterios INVEST

| Criterio | Cumplimiento |
|----------|--------------|
| **I**ndependent | ✅ Vista independiente con su propio estado |
| **N**egotiable | ✅ Filtros, estadísticas y diseño son negociables |
| **V**aluable | ✅ Funcionalidad core para operaciones de almacén |
| **E**stimable | ✅ ~10 story points |
| **S**mall | ✅ Alcanzable en 1-2 sprints |
| **T**estable | ✅ Criterios claros para cada funcionalidad |

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Vista inicial del almacén
```gherkin
Given que accedo a la sección "Almacén"
When la vista se carga completamente
Then debo ver:
  - Un header con el título "Almacén de Envíos"
  - Estadísticas rápidas (Total, Entregados, En Camino)
  - Un sidebar con filtros por estado
  - Una barra de búsqueda
  - Una grilla de tarjetas de envíos
```

#### Escenario 2: Tarjeta de envío con información completa
```gherkin
Given que estoy viendo el almacén
When observo una tarjeta de envío
Then debo ver:
  | Elemento               | Ejemplo                    |
  | Número de seguimiento  | SHIP-1234567890            |
  | Nombre del cliente     | Juan Pérez                 |
  | Badge de estado        | 📦 Preparando              |
  | Barra de progreso      | 33%                        |
  | Descripción del paquete| "Electrónicos frágiles"    |
  | Origen y Destino       | Bogotá → Medellín          |
  | Peso y Precio          | 5.5 kg - $125,000          |
  | Badge Frágil           | ⚠️ Frágil (si aplica)      |
  | Método de Pago         | 💳 Tarjeta / 💵 Efectivo   |
```

#### Escenario 3: Filtrar envíos por estado
```gherkin
Given que estoy en la vista de almacén
And existen envíos en diferentes estados
When selecciono el filtro "En Camino" en el sidebar
Then solo debo ver envíos con estado "IN_TRANSIT" o "OUT_FOR_DELIVERY"
And el contador del filtro debe mostrar la cantidad correcta
And el filtro "En Camino" debe estar resaltado
```

#### Escenario 4: Buscar envío
```gherkin
Given que estoy en la vista de almacén
When escribo "SHIP-123" en la barra de búsqueda
Then debo ver solo los envíos cuyo número de seguimiento, 
     nombre de cliente o dirección contenga "SHIP-123"
And la búsqueda debe ser instantánea (debounced)
```

#### Escenario 5: Estado vacío
```gherkin
Given que no hay envíos que coincidan con los filtros
When la grilla está vacía
Then debo ver un mensaje amigable:
  - Icono de inbox vacío
  - Texto "No hay envíos"
  - Sugerencia según el contexto (filtros activos o no)
```

### Notas Técnicas para TDD
- Componente: `WarehouseView.tsx`
- Servicio: `shipmentService.getShipments()`
- Estado local: `ShipmentStateService` (Singleton)
- Filtros: useMemo para performance

---

## 🚛 HU-15: Control Manual de Estados y Asignación de Camiones

### Historia de Usuario
**Como** supervisor de operaciones,
**Quiero** cambiar manualmente el estado de los envíos y asignar camiones,
**Para** reflejar la realidad operativa y tener control total del proceso.

### Criterios INVEST

| Criterio | Cumplimiento |
|----------|--------------|
| **I**ndependent | ✅ Funcionalidad específica de gestión |
| **N**egotiable | ✅ Estados y reglas de transición negociables |
| **V**aluable | ✅ Control operativo crítico |
| **E**stimable | ✅ ~5 story points |
| **S**mall | ✅ Alcanzable en un sprint |
| **T**estable | ✅ Transiciones y validaciones verificables |

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Flujo de estados válidos
```gherkin
Given que tengo un envío en estado "PAYMENT_CONFIRMED"
When presiono el botón "Avanzar"
Then el estado debe cambiar según el flujo:
  | Estado Actual      | Siguiente Estado    |
  | PAYMENT_CONFIRMED  | PREPARING           |
  | PREPARING          | READY_FOR_PICKUP    |
  | READY_FOR_PICKUP   | IN_TRANSIT          |
  | IN_TRANSIT         | OUT_FOR_DELIVERY    |
  | OUT_FOR_DELIVERY   | DELIVERED           |
And el cambio debe persistir en localStorage
And debo ver el nuevo estado reflejado inmediatamente
```

#### Escenario 2: Estados especiales (no entregado, devolución)
```gherkin
Given que tengo un envío que no está en estado terminal
When presiono "No Entregado" o "Devolución"
Then el envío debe cambiar al estado especial seleccionado
And debe ser posible establecer estos estados desde cualquier estado no terminal
And estos estados son terminales (no pueden avanzar más)
```

#### Escenario 3: Requerimiento de camión para avanzar
```gherkin
Given que tengo un envío en estado "PREPARING" o "READY_FOR_PICKUP"
And NO tiene un camión asignado
When intento avanzar el estado
Then el botón "Avanzar" debe estar deshabilitado
And debo ver el mensaje "⚠️ Asigna un camión para poder avanzar el estado"
```

#### Escenario 4: Asignar camión a envío
```gherkin
Given que tengo un envío sin camión asignado
When presiono "🚚 Asignar Camión"
Then debo ver una lista de camiones disponibles:
  | Placa    | Conductor       | Capacidad |
  | ABC-123  | Carlos Mendoza  | 500 kg    |
  | DEF-456  | María García    | 1000 kg   |
When selecciono un camión
Then el camión debe asignarse al envío
And debo ver la información del camión en la tarjeta del envío
And debe registrarse en el historial
```

#### Escenario 5: Remover camión asignado
```gherkin
Given que tengo un envío con camión asignado
And el envío NO está en estado terminal
When presiono "Quitar" en la sección del camión
Then el camión debe desasignarse
And debe registrarse "Camión desasignado" en el historial
```

#### Escenario 6: Ver historial de estados
```gherkin
Given que tengo un envío con múltiples cambios de estado
When presiono "📋 Ver historial de estados"
Then debo ver un modal con todos los cambios:
  | Estado           | Fecha        | Hora   | Nota                          |
  | PAYMENT_CONFIRMED| 20/01/2026   | 10:00  | Estado inicial                |
  | PREPARING        | 20/01/2026   | 10:30  | Cambio a PREPARING            |
  | Camión asignado  | 20/01/2026   | 11:00  | ABC-123 (Carlos Mendoza)      |
And la lista debe estar ordenada de más reciente a más antigua
```

#### Escenario 7: Persistencia de estados
```gherkin
Given que he realizado cambios de estado en varios envíos
When recargo la página
Then todos los estados deben mantenerse
And los camiones asignados deben mantenerse
And el historial de cambios debe estar completo
```

#### Escenario 8: Pago en efectivo - Estado inicial correcto
```gherkin
Given que se crea un nuevo envío con método de pago "Efectivo"
When el envío aparece en el almacén
Then el estado inicial debe ser "PAYMENT_CONFIRMED"
And NO debe pasar por "PENDING_PAYMENT"
Because el pago en efectivo se realiza al momento de la entrega
```

### Notas Técnicas para TDD
- Servicio: `ShipmentStateService` (Singleton con Observer)
- Persistencia: localStorage
- Validaciones: `isValidTransition()`, `getNextStatus()`
- Constantes: `STATUS_FLOW`, `TERMINAL_STATES`, `SPECIAL_STATES`

---

## 📊 HU-16: Estadísticas y Dashboard de Almacén

### Historia de Usuario
**Como** gerente de logística,
**Quiero** ver estadísticas en tiempo real del almacén,
**Para** monitorear el rendimiento operativo y tomar decisiones informadas.

### Criterios INVEST

| Criterio | Cumplimiento |
|----------|--------------|
| **I**ndependent | ✅ Métricas calculadas localmente |
| **N**egotiable | ✅ Métricas mostradas son negociables |
| **V**aluable | ✅ Información de gestión valiosa |
| **E**stimable | ✅ ~3 story points |
| **S**mall | ✅ Componente pequeño |
| **T**estable | ✅ Cálculos verificables |

### Criterios de Aceptación (Gherkin)

#### Escenario 1: Métricas principales visibles
```gherkin
Given que accedo a la vista de almacén
When observo el header
Then debo ver las siguientes estadísticas:
  | Métrica     | Estilo                  | Descripción            |
  | Total       | Fondo azul degradado    | Todos los envíos       |
  | Entregados  | Fondo verde degradado   | Estado DELIVERED       |
  | En Camino   | Fondo violeta degradado | IN_TRANSIT + OUT_FOR_DELIVERY |
```

#### Escenario 2: Actualización automática
```gherkin
Given que estoy viendo las estadísticas
When cambio el estado de un envío de IN_TRANSIT a DELIVERED
Then la estadística "En Camino" debe decrementarse
And la estadística "Entregados" debe incrementarse
And la actualización debe ser inmediata (sin recargar)
```

#### Escenario 3: Contadores en filtros
```gherkin
Given que estoy viendo el sidebar de filtros
When observo los filtros por estado
Then cada filtro debe mostrar un contador con la cantidad de envíos en ese estado
And los contadores deben actualizarse cuando cambian los estados
```

---

## 📊 Resumen de Priorización (Estimación MoSCoW)

### Must Have (Esenciales)
- **HU-12**: Formulario Wizard de Creación de Envíos (core de la aplicación)
- **HU-14**: Sistema de Gestión de Almacén (operaciones diarias)
- **HU-15**: Control Manual de Estados y Asignación de Camiones (gestión operativa)

### Should Have (Importantes)
- **HU-11**: Visualización de Rutas en Mapa (UX mejorada)
- **HU-13**: Procesamiento de Pago con Animación (confianza del usuario)

### Could Have (Deseables)
- **HU-16**: Estadísticas y Dashboard de Almacén (reporting)

---

## 🧪 Notas para el Agente TDD

### Orden recomendado de implementación:
1. **HU-14/HU-15** - Sistema de Almacén (base para persistencia)
2. **HU-12** - Wizard de Envíos (flujo principal)
3. **HU-13** - Modal de Pago (UX)
4. **HU-11** - Mapa (integración externa)
5. **HU-16** - Estadísticas (calculadas)

### Tests prioritarios:
- Unit tests para `ShipmentStateService` (Singleton, Observer, transiciones)
- Unit tests para validaciones del wizard
- Integration tests para flujo completo de creación de envío
- Component tests para componentes visuales (modal, tarjetas)

### Patrones de diseño a aplicar:
- **Singleton**: `ShipmentStateService`
- **Observer**: Suscripción a cambios de estado
- **State Machine**: Flujo de estados de envío y procesamiento de pago
- **Repository**: Abstracción de persistencia
- **Strategy**: Diferentes estrategias de validación y transición

### Cobertura esperada: 
80%+ en lógica de negocio (services y hooks)

---

**Versión del Documento:** 2.0  
**Última Actualización:** 2026-01-20  
**Relacionado con:** [USER_STORIES.md](USER_STORIES.md), [ARCHITECTURE.md](ARCHITECTURE.md), [TDD_GUIDE.md](TDD_GUIDE.md)
