# 💳 Tarjetas de Prueba para Testing

## Números de Tarjeta Válidos (Algoritmo de Luhn)

Para probar el flujo de pagos, usa estos números de tarjeta que pasan la validación del algoritmo de Luhn:

### Visa
- **4532 0151 1283 0366** ✅
- **4111 1111 1111 1111** ✅
- **4532 1488 0343 6467** ✅

### Mastercard
- **5425 2334 3010 9903** ✅
- **5555 5555 5555 4444** ✅
- **5105 1051 0510 5100** ✅

### American Express
- **3742 4545 5400 126** ✅
- **3782 822463 10005** ✅

## Datos de Prueba Completos

### Ejemplo 1: Visa
```
Número: 4532 0151 1283 0366
Titular: JUAN RODRIGUEZ
Fecha Expiración: 12/29
CVV: 123
```

### Ejemplo 2: Mastercard
```
Número: 5425 2334 3010 9903
Titular: MARIA GARCIA
Fecha Expiración: 08/28
CVV: 456
```

### Ejemplo 3: American Express
```
Número: 3742 4545 5400 126
Titular: CARLOS LOPEZ
Fecha Expiración: 06/27
CVV: 7890
```

## Notas Importantes

- ✅ Todos estos números pasan la validación del **Algoritmo de Luhn**
- 🔒 Son números de prueba estándar de la industria de pagos
- 💡 En producción, estos números serían procesados por un gateway real (Stripe, PayU, etc.)
- ⚠️ **NO usar tarjetas reales en desarrollo**

## Validación del Algoritmo de Luhn

El sistema valida automáticamente cada número de tarjeta usando el algoritmo de Luhn para garantizar:
1. El formato correcto del número
2. Detección de errores de digitación
3. Compatibilidad con estándares de la industria

## Fechas de Expiración

Para pruebas, usa cualquier fecha futura en formato **MM/YY**:
- ✅ `12/29` (válido)
- ✅ `08/28` (válido)
- ❌ `13/25` (mes inválido)
- ❌ `01/20` (expirado)

## CVV

- Visa/Mastercard: **3 dígitos** (ej: 123, 456, 789)
- American Express: **4 dígitos** (ej: 1234, 7890)
