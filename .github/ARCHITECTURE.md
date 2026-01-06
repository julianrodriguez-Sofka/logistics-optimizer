# Logistics Shipping Optimizer - Architecture

## Tech Stack
- **Backend:** Express.js + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Database:** MongoDB + Mongoose ODM
- **Pattern:** Adapter Pattern (multi-provider shipping support) + Repository Pattern (data persistence)

---

## Adapter Pattern Implementation

### Class Diagram
```mermaid
classDiagram
    class IShippingProvider {
        <<interface>>
        +calculateShipping(weight, destination)*
        +trackShipment(trackingId)*
        +validateAddress(address)*
    }

    class FedExAdapter {
        -apiKey: string
        -baseUrl: string
        +calculateShipping(weight, destination)
        +trackShipment(trackingId)
        +validateAddress(address)
    }

    class DHLAdapter {
        -credentials: Auth
        -endpoint: string
        +calculateShipping(weight, destination)
        +trackShipment(trackingId)
        +validateAddress(address)
    }

    class LocalAdapter {
        -rates: Map
        +calculateShipping(weight, destination)
        +trackShipment(trackingId)
        +validateAddress(address)
    }

    class ShippingService {
        -provider: IShippingProvider
        +setProvider(provider)
        +getQuote(shipment)
        +createShipment(details)
    }

    IShippingProvider <|.. FedExAdapter
    IShippingProvider <|.. DHLAdapter
    IShippingProvider <|.. LocalAdapter
    ShippingService --> IShippingProvider
```

---

## Folder Structure - Clean Architecture

```
shipping-optimizer/
├── logistics-back/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── Shipment.ts
│   │   │   │   ├── Quote.ts
│   │   │   └── interfaces/
│   │   │       ├── IShippingProvider.ts
│   │   │       └── IRepository.ts
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   ├── ShippingService.ts
│   │   │   │   └── QuoteService.ts
│   │   │   └── use-cases/
│   │   │       ├── CalculateShippingUseCase.ts
│   │   │       └── TrackShipmentUseCase.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/
│   │   │   │   ├── FedExAdapter.ts
│   │   │   │   ├── DHLAdapter.ts
│   │   │   │   └── LocalAdapter.ts
│   │   │   ├── controllers/
│   │   │   │   ├── ShippingController.ts
│   │   │   │   └── QuoteController.ts
│   │   │   ├── routes/
│   │   │   │   ├── shipping.routes.ts
│   │   │   │   └── quotes.routes.ts
│   │   │   └── database/
│   │   │       ├── models/
│   │   │       │   ├── QuoteModel.ts
│   │   │       │   └── ShipmentModel.ts
│   │   │       ├── repositories/
│   │   │       │   ├── QuoteRepository.ts
│   │   │       │   └── ShipmentRepository.ts
│   │   │       └── connection.ts
│   │   └── main.ts
│   └── package.json
└── logistics-front/
    ├── src/
    │   ├── domain/
    │   │   └── models/ (Type definitions)
    │   ├── presentation/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   └── hooks/
    │   ├── services/
    │   │   └── api.client.ts
    │   └── App.tsx
    └── package.json
```

---

## Key Principles

- **Single Responsibility:** Each adapter handles one provider only
- **Dependency Injection:** ShippingService receives provider via constructor
- **Abstraction:** Controllers depend on interfaces, not implementations
- **Repository Pattern:** Data access abstraction with `IQuoteRepository`, `IShipmentRepository`
- **Separation of Concerns:** Domain ≠ Application ≠ Infrastructure
- **Frontend Agnostic:** React consumes REST API via service layer

---

## Data Flow
- **Request:** React → API Client → Express Controller → Service → Adapter → Provider
- **Response:** Provider → Adapter → Service → Controller → JSON → React UI

---

## Extension Points
- Add new shipping provider: Create new adapter implementing `IShippingProvider`
- Add new domain entity: Define in `domain/entities/`, extend repository
- Add new use case: Create in `application/use-cases/`, inject dependencies

