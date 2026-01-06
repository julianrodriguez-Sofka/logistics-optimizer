# Logistics Shipping Optimizer - Product Specification

## 1. Data Flow Specification

### Input Validation (Request Payload)

| Field | Type | Validation Rule | Error Response |
|:---|:---|:---|:---|
| **origin** | string | Required, not empty, valid city/postal code | 400: Invalid origin |
| **destination** | string | Required, not empty, valid city/postal code | 400: Invalid destination |
| **weight** | number | > 0.1 kg, ≤ 1000 kg | 400: Weight out of range |
| **pickupDate** | ISO 8601 Date | >= Today, ≤ 30 days ahead | 400: Invalid date |
| **fragile** | boolean (optional) | true/false | — |

### Request Example
```json
{
  "origin": "New York, NY",
  "destination": "Los Angeles, CA",
  "weight": 5.5,
  "pickupDate": "2026-01-10",
  "fragile": false
}
```

---

## 2. Output Logic (Response)

### Standardized Response Format
```json
{
  "quotes": [
    {
      "provider": "FedEx",
      "price": 89.99,
      "estimatedDays": 3,
      "isCheapest": false,
      "isFastest": true,
      "status": "online"
    },
    {
      "provider": "DHL",
      "price": 75.50,
      "estimatedDays": 5,
      "isCheapest": true,
      "isFastest": false,
      "status": "online"
    },
    {
      "provider": "Local",
      "price": 120.00,
      "estimatedDays": 7,
      "isCheapest": false,
      "isFastest": false,
      "status": "online"
    }
  ],
  "requestId": "UUID",
  "timestamp": "2026-01-06T15:30:00Z"
}
```

### Badge Logic

| Badge | Condition | Rule |
|:---|:---|:---|
| **isCheapest** | Lowest price | Single value; if tie, first provider wins |
| **isFastest** | Lowest estimatedDays | Single value; if tie, first provider wins |
| **status** | Adapter response time | "online" if response ≤ 5s, "offline" if timeout |

### Calculation Rules
- **Price:** Adapter-specific rate × weight + base fee + surcharge (if fragile)
- **EstimatedDays:** Adapter-specific SLA + buffer for validation
- **Fragile Surcharge:** +15% to price if `fragile: true`

---

## 3. Dashboard Widgets

### Widget 1: Unified API Status
```
┌─────────────────────────┐
│  System Status: ONLINE  │
│  Last Check: 2m ago     │
│  Adapters: 3/3 Active   │
└─────────────────────────┘
```

- **Display Rule:** "Online" if ≥2 adapters responding
- **Display Rule:** "Degraded" if 1 adapter responding
- **Display Rule:** "Offline" if 0 adapters responding
- **Refresh:** Every 30 seconds

### Widget 2: Active Adapters Counter

| Adapter | Status | Response Time | Last Sync |
|:---|:---|:---|:---|
| FedEx | 🟢 Online | 420ms | 2m ago |
| DHL | 🟢 Online | 580ms | 2m ago |
| Local | 🟢 Online | 150ms | 2m ago |

- **Count:** Total adapters showing 🟢 Online
- **Metric:** Successful quote responses in last sync cycle
- **Alert:** Show ⚠️ if any adapter down >5 minutes

---

## 4. Error Handling

| Scenario | Status Code | Response |
|:---|:---|:---|
| All adapters offline | 503 | `{ error: "Service unavailable", retryAfter: 30 }` |
| Invalid input data | 400 | `{ error: "Validation failed", details: [...] }` |
| Single adapter timeout | 200 | Return response with `status: "offline"` for that provider |
| Duplicate request (same payload) | 200 | Return cached result from MongoDB (cache TTL: 5 minutes) |
| Database connection error | 503 | `{ error: "Database unavailable", message: "..." }` |

---

## 5. Key Feature Requirements

- ✓ Multi-provider comparison in single API call
- ✓ Real-time adapter health monitoring (dashboard)
- ✓ Automatic badge assignment (cheapest/fastest)
- ✓ Request caching with MongoDB TTL indexes (5-minute TTL) to reduce adapter load
- ✓ Quote history persistence in MongoDB for analytics
- ✓ Graceful degradation (1+ adapter down = system operational)
- ✓ ISO 8601 date handling (timezone-aware)

---

## 6. Performance Targets

| Metric | Target |
|:---|:---|
| API Response Time (all adapters online) | < 3 seconds |
| Single Adapter Timeout | 5 seconds |
| Dashboard Refresh Rate | 30 seconds |
| Cache Hit Ratio Target | 60%+ |
