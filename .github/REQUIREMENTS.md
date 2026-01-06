# Logistics Pro: System Requirements & Test Specifications

## 1. Product Context
A real-time shipping optimizer that normalizes multiple carrier APIs (FedEx, DHL, Local) through an Adapter Pattern to find the best logistics option based on cost and speed.

## 2. User Stories (HU)

### HU-01: Shipping Rate Comparison
**As a** Logistics Manager,
**I want to** input shipping details (Origin, Destination, Weight, Date),
**So that** I can see a standardized list of quotes from all connected providers.

### HU-02: Smart Ranking & Tagging
**As a** User,
**I want** the system to automatically highlight the "Cheapest" and "Fastest" options,
**So that** I can make data-driven decisions instantly.

---

## 3. Functional Specifications (Gherkin / Acceptance Criteria)

### Feature: Unified Shipping Calculation

**Scenario: Standard Quote Retrieval (Happy Path)**
- **Given** the "FedEx", "DHL", and "Local" adapters are active.
- **When** the user provides:
    - `originAddress`: "123 Logistics Way"
    - `destinationAddress`: "456 Target Ave"
    - `weight`: 15.5 (kg)
    - `pickupDate`: Future Date
- **Then** the system must return a JSON array with 3 quote objects.
- **And** each object must include: `providerName`, `price`, `estimatedDays`, and `transportMode`.

**Scenario: Badge Logic (Logic Check)**
- **Given** multiple quotes are returned.
- **When** the system processes the results.
- **Then** the quote with the lowest `price` must have `isCheapest: true`.
- **And** the quote with the lowest `estimatedDays` must have `isFastest: true`.

---

## 4. Edge Cases & Validation (For Unit Testing)

| Case | Input Condition | Expected Behavior |
| :--- | :--- | :--- |
| **Invalid Weight** | `weight <= 0` | Throw `ValidationError`: "Weight must be > 0". |
| **Past Date** | `pickupDate < current_date` | Throw `ValidationError`: "Date cannot be in the past". |
| **Provider Timeout** | One adapter fails (e.g., FedEx) | Return quotes from DHL/Local + Log error. |
| **Extreme Weight** | `weight > 1000kg` | Return "Local" provider only (simulate heavy load limit). |
| **Empty Address** | `originAddress == ""` | Disable "Calculate Rates" button / HTTP 400. |

---

## 5. Technical Data Contract (Standardized Output)

Every adapter must normalize its provider's raw response to this structure:

```typescript
interface IQuote {
  providerId: string;      // e.g., 'fedex-ground'
  providerName: string;    // e.g., 'FedEx Ground'
  price: number;           // e.g., 32.80
  currency: string;        // e.g., 'USD'
  minDays: number;         // e.g., 3
  maxDays: number;         // e.g., 4
  transportMode: string;   // e.g., 'Truck', 'Air Freight'
  isCheapest: boolean;     // Computed by Service
  isFastest: boolean;      // Computed by Service
}