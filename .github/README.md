# 📋 Project Documentation Index - Shipping Optimizer

## Overview
This repository contains a **Logistics Shipping Optimizer** system that compares shipping rates from multiple providers (FedEx, DHL, Local) using the **Adapter Pattern** and follows **TDD (Test-Driven Development)** principles.

---

## 📚 Documentation Structure

### 1. **[USER_STORIES.md](USER_STORIES.md)** - User Stories (Historias de Usuario)
**Purpose:** Defines WHAT the system should do from the user's perspective

**Contains:**
- 10 user stories following INVEST methodology
- Gherkin acceptance criteria for each story
- MoSCoW prioritization (Must/Should/Could Have)
- Success metrics

**Key User Stories:**
- HU-01: Request shipping quotes
- HU-02: Input validation
- HU-03: Identify cheapest/fastest options
- HU-04: System health monitoring
- HU-05: Graceful degradation handling

**Use this when:** 
- Understanding user requirements
- Writing acceptance tests
- Communicating with stakeholders

---

### 2. **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Technical Implementation Plan
**Purpose:** Defines HOW to implement the system using TDD

**Contains:**
- 4-week sprint breakdown (40 tasks)
- Architecture design (SOLID compliance)
- Task dependencies and timelines
- Success metrics per sprint

**Sprint Structure:**
- **Sprint 1:** Foundation (Domain entities, Validation, Mock adapters)
- **Sprint 2:** Core API (Quote service, Error handling)
- **Sprint 3:** DevOps (MongoDB, CI/CD pipeline, Health monitoring)
- **Sprint 4:** Frontend (React components, E2E tests)

**Use this when:**
- Planning development work
- Assigning tasks to team members
- Tracking progress

---

### 3. **[TDD_GUIDE.md](TDD_GUIDE.md)** - TDD Implementation Guide
**Purpose:** Quick reference for writing tests and implementing features

**Contains:**
- Test checklists for each user story
- Complete test examples (Unit, Integration, E2E)
- GitHub Copilot prompts for generating tests
- TDD best practices and pitfalls to avoid

**Test Coverage Targets:**
- Unit Tests: 70%+ (domain + application layers)
- Integration Tests: 3+ API endpoint test suites
- E2E Tests: 3+ critical user flows

**Use this when:**
- Writing tests for a specific user story
- Need examples of test structure
- Generating edge cases with AI
**Related:**
- [plan-template.md](../../../.github/templates/plan-template.md) - Template for creating individual HU plans (workspace level)
---

### 4. **[PRODUCT.md](PRODUCT.md)** - Product Specification
**Purpose:** Technical data contracts and API specifications

**Contains:**
- Input validation rules
- Output data format (JSON structure)
- Badge assignment logic
- Performance targets (< 3s response time)
- Error handling specifications

**Use this when:**
- Implementing API endpoints
- Validating request/response formats
- Understanding business rules

---

### 5. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture & Data Contracts
**Purpose:** Technical architecture, design patterns, and TypeScript interfaces

**Contains:**
- Layer structure (Domain, Application, Infrastructure)
- SOLID principles implementation
- Adapter pattern details
- TypeScript interfaces (`IQuote`, `IShippingProvider`)
- Edge cases and validation rules
- Technology stack

**Use this when:**
- Understanding code organization
- Implementing new adapters
- Defining data contracts
- Reviewing code for SOLID compliance

---

### 6. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture Documentation
**Purpose:** Technical architecture and design patterns

**Contains:**
- Layer structure (Domain, Application, Infrastructure)
- SOLID principles implementation
- Adapter pattern details
- Technology stack

**Use this when:**
- Understanding code organization
- Adding new features
- Reviewing code for SOLID compliance

---

### 7. **[copilot-instructions.md](copilot-instructions.md)** - Developer Workflow Guide
**Purpose:** Development environment setup and workflows

**Contains:**
- Project structure
- Setup commands (npm install, npm run dev)
- CI/CD pipeline configuration
- Gitflow workflow
- MongoDB setup

**Use this when:**
- Setting up development environment
- Running tests locally
- Understanding build/deploy process

---

## 🚀 Quick Start for TDD Agent

### Step 1: Read User Stories
```bash
Open: USER_STORIES.md
Focus: HU-01 to HU-05 (Must-Have stories)
```

### Step 2: Review Implementation Plan
```bash
Open: IMPLEMENTATION_PLAN.md
Start: Sprint 1 → Task 1.2 (QuoteRequest validation)
```

### Step 3: Follow TDD Guide
```bash
Open: TDD_GUIDE.md
Section: HU-02 Test Checklist
```

### Step 4: Write Tests First (RED)
```typescript
// Example: Test for weight validation
test('should reject weight <= 0', () => {
  expect(() => new QuoteRequest({ weight: 0 }))
    .toThrow('Weight must be > 0.1 kg');
});
```

### Step 5: Implement Code (GREEN)
```typescript
// Minimal code to make test pass
class QuoteRequest {
  constructor(data) {
    if (data.weight <= 0) {
      throw new Error('Weight must be > 0.1 kg');
    }
    // ... more validation
  }
}
```

### Step 6: Refactor (REFACTOR)
```typescript
// Improve code quality while keeping tests green
class QuoteRequest {
  constructor(data) {
    this.validateWeight(data.weight);
  }
  
  private validateWeight(weight: number): void {
    if (weight <= 0 || weight < 0.1) {
      throw new ValidationError('Weight must be > 0.1 kg');
    }
    if (weight > 1000) {
      throw new ValidationError('Weight must be ≤ 1000 kg');
    }
  }
}
```

---

## 📊 Project Progress Tracking

### Week 1: Architecture & Clean Code 
- [ ] SOLID principles implemented (0 violations)
- [ ] Adapter pattern implemented (3 adapters)
- [ ] Domain entities created
- [ ] Validation logic with 15+ unit tests

### Week 2: AI Acceleration 🤖
- [ ] GitHub Copilot used for test generation
- [ ] Edge cases generated with AI prompts
- [ ] QuoteService with error handling
- [ ] API endpoints with integration tests

### Week 3: DevOps & Quality 🔧
- [ ] Gitflow workflow (main/develop/feature/*)
- [ ] GitHub Actions CI pipeline
- [ ] MongoDB integration
- [ ] Health monitoring system

### Week 4: Full Stack Automation 🚀
- [ ] Unit test coverage ≥70%
- [ ] 3+ API integration tests
- [ ] 3+ E2E tests with Playwright
- [ ] Frontend React components

---

## 🎯 Success Criteria

### Code Quality
 **SOLID Compliance:** 0 violations (verified by code review)
 **Design Pattern:** Adapter pattern correctly implemented
 **Test Coverage:** 70%+ in business logic

### Functionality
 **HU-01:** Quote retrieval works (all providers)
 **HU-02:** Input validation enforced (10+ test cases)
 **HU-03:** Badges correctly assigned (8+ test cases)
 **HU-04:** System health monitoring works
 **HU-05:** Graceful degradation handling

### DevOps
 **CI/CD:** Pipeline runs on every push to develop/main
 **Tests:** All tests pass in CI environment
 **Gitflow:** Proper branching strategy in use

---

## 🔗 Document Relationships

```
USER_STORIES.md (WHAT to build)
       ↓
       ↓ defines acceptance criteria
       ↓
IMPLEMENTATION_PLAN.md (HOW to build - Tasks)
       ↓
       ↓ provides task breakdown
       ↓
TDD_GUIDE.md (HOW to test - Examples)
       ↓
       ↓ references specs
       ↓
PRODUCT.md (API specs) & ARCHITECTURE.md (Data contracts)
       ↓
       ↓ guided by architecture
       ↓
ARCHITECTURE.md (Structure, Patterns & Interfaces)
       ↓
       ↓ implemented using
       ↓
copilot-instructions.md (Dev environment)
```

---

## 📝 How to Use This Documentation

### For Product Owners / Stakeholders
1. Read [USER_STORIES.md](USER_STORIES.md) to understand features
2. Review acceptance criteria (Gherkin scenarios)
3. Track progress using Sprint checklists in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

### For Developers
1. Start with [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for task assignment
2. Use [TDD_GUIDE.md](TDD_GUIDE.md) for test examples
3. Reference [PRODUCT.md](PRODUCT.md) for API contracts
4. Follow [copilot-instructions.md](copilot-instructions.md) for setup

### For QA / Testers
1. Use [USER_STORIES.md](USER_STORIES.md) Gherkin scenarios as test cases
2. Reference [TDD_GUIDE.md](TDD_GUIDE.md) for automated test structure
3. Verify coverage using commands in TDD_GUIDE.md

### For TDD Agent
1. **Read:** [USER_STORIES.md](USER_STORIES.md) → Understand requirements
2. **Plan:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) → Get task sequence
3. **Implement:** [TDD_GUIDE.md](TDD_GUIDE.md) → Write tests → Write code
4. **Validate:** Run tests, check coverage ≥70%

---

## 🛠️ Commands Reference

### Backend Development
```bash
cd logistics-back
npm install                  # Install dependencies
npm run dev                  # Start dev server (port 3000)
npm test                     # Run unit tests
npm run test:coverage        # Generate coverage report
npm run test:integration     # Run API tests
npm run build                # Compile TypeScript
```

### Frontend Development
```bash
cd logistics-front
npm install                  # Install dependencies
npm run dev                  # Start Vite dev server (port 5173)
npm test                     # Run Vitest unit tests
npm run test:coverage        # Generate coverage report
npm run build                # Production build
npm run lint                 # Run ESLint
```

### MongoDB Setup (Docker)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
# Connection string: mongodb://localhost:27017/logistics-optimizer
```

### Run CI Pipeline Locally
```bash
# Simulate GitHub Actions
npm ci                       # Clean install
npm run build                # Build project
npm test                     # Run all tests
```

---

## 📞 Support & Resources

- **GitHub Copilot:** Use prompts from [TDD_GUIDE.md](TDD_GUIDE.md)
- **Test Examples:** See detailed examples in [TDD_GUIDE.md](TDD_GUIDE.md)
- **API Specs:** Reference [PRODUCT.md](PRODUCT.md)
- **Architecture Questions:** See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🎓 Learning Resources

### SOLID Principles
- Single Responsibility: Each adapter handles ONE provider
- Open/Closed: Add new providers without modifying existing code
- Liskov Substitution: All adapters are interchangeable (implement same interface)
- Interface Segregation: Separate interfaces for shipping/tracking/validation
- Dependency Inversion: Services depend on `IShippingProvider` interface

### Adapter Pattern
- **Problem:** Different provider APIs (FedEx, DHL, Local) have different interfaces
- **Solution:** Create adapters that normalize all providers to `IShippingProvider`
- **Benefit:** Add new providers without changing core business logic

### TDD Cycle
```
RED → GREEN → REFACTOR

RED:      Write failing test (defines expected behavior)
GREEN:    Write minimal code to pass test
REFACTOR: Improve code while keeping tests green
REPEAT:   Next test case
```

---

**Last Updated:** 2026-01-06
**Version:** 1.0
**Status:**  Ready for TDD Implementation

---

## Next Actions

1. **TDD Agent:** Start with Sprint 1, Task 1.2 (QuoteRequest validation)
2. **Review:** Ensure understanding of all 5 Must-Have user stories (HU-01 to HU-05)
3. **Setup:** Configure development environment using copilot-instructions.md
4. **Execute:** Follow Red-Green-Refactor cycle for each task
5. **Track:** Update progress in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) task checklist

**Remember:** User stories are FOCUSED on user interactions, not technical implementation. Tests verify behavior, not code structure. 🎯
