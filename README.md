# PackYourBag - Project Overview

Luggage management tool

Work in Progress - `dev` branch is where the amazing stuff is happening right now...

## Contents

- [1. Idea & motivation](#1-idea--motivation)
- [2. Key Features & Project Goals](#2-key-features--project-goals)
  - [2.1 Structured Data Management (The Core Entities)](#21-structured-data-management-the-core-entities)
  - [2.2 Efficient Pack Preparation](#22-efficient-pack-preparation)
  - [2.3 Trip Readiness and Execution (Packing Check-Off)](#23-trip-readiness-and-execution-packing-check-off)
- [3. Development & Skills](#3-development--skills)
- [4. Technical Specifications & Architecture](#4-technical-specifications--architecture)
  - [4.1 Project Architecture & Tech Stack](#41-project-architecture--tech-stack)
  - [4.2 Data Persistence (Database & ORM)](#42-data-persistence-database--orm)
  - [4.3 Authentication](#43-authentication)
- [5. Development Strategy & Roadmap](#5-development-strategy--roadmap)
- [6. Implementation](#6-implementation)
  - [6.1 Phase 0: Development Setup & Foundation](#61-phase-0-development-setup--foundation)
  - [6.2 Phase 1: Identity Provider](#62-phase-1-identity-provider)
  - [6.3 Phase 2: Resource Server (Product Service)](#63-phase-2-resource-server-product-service)

## 1. Idea & motivation

As an avid backpacker and long-distance hiker, packing lists have always been a part of my routine. When you're out in the wilderness, finding out you forgot some essential gear is simply not an option. Before starting on a new adventure, I find myself manually ticking off items from a trusty Excel spreadsheet, to make sure nothing gets left behind.

<p align="center" >
    <br>
    <img src="assets/project-overview-spreadsheet.png" width="800" alt="Excel packlist spreadsheet">
    <br>
    <i>Example of a messy packing list in progress…</i>
</p>

Different trips or seasons require different gear, so my spreadsheet is constantly evolving. It gets copied, extended, pruned, and modified before each trip.

This app evolves the packing list from a rigid spreadsheet into a dynamic, reusable, and flexible packing management system. It should allow users to rapidly generate and customize gear lists for any scenario, and provide a clear interactive checklist when it’s time to pack.

While built for outdoor adventures, the modular architecture could adapt to any scenario requiring hierarchical inventory management.

## 2. Key Features & Project Goals

The application manages packing logistics through a hierarchical data model, enabling users to transition from granular item management to complex, trip-specific configurations.

### 2.1 Structured Data Management (The Core Entities)

The app uses a series of interconnected entities to organize packing data. By decoupling physical inventory (Items) from logical collections (Lists and Packs), the architecture enables users to build modular configurations that can be reused across different trip profiles.

| **Entity** | **Purpose**                                                                                               | **Key Properties**                             | **Relationships**                                |
| ---------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Item       | The basic unit of packing (e.g., a tent, a shirt, a camera battery)                                       | Name (Required), Weight, Description, Category | Can be assigned to a List or directly to a Pack. |
| Category   | Groups items for organization (e.g., Electronics, Shelter, Clothing).                                     | Name (Required), Description                   | Linked to one or more Items.                     |
| List       | A reusable grouping of Items (e.g., "Summer sleeping kit" or "Winter sleeping kit").                      | Name (Required), Description, Color Code       | Can be combined into a Pack.                     |
| Pack       | The final, compiled packing list for a specific need (e.g., "Winter Thru-Hike" or "5-Day Business Trip"). | Name (Required), Description                   | Can be selected for a Trip.                      |
| Trip       | A specific instance of a journey.                                                                         | Name (Required), Description, Date, Remarks    | Uses one Pack as its definitive packing list.    |

### 2.2 Efficient Pack Preparation

- **Composition:** Users can construct Packs by aggregating existing Lists or assigning individual Items, allowing for flexible, high-speed configuration.
- **Prototyping:** Existing Packs can be cloned and modified, serving as templates to minimize redundant data entry for similar trip profiles.
- **Data Aggregation:** The system calculates metadata in the background, providing cumulative weight totals and category breakdowns.

### 2.3 Trip Readiness and Execution (Packing Check-Off)

Once a Pack is assigned to a Trip, the user can transition into the execution phase:

- **Item Verification:** Users can check off items as they are packed, providing an immediate overview of progress and missing gear.
- **Filtered Views:** The system can isolate unchecked items to assist with last-minute needs, such as generating a shopping list for missing consumables or equipment.

## 3. Development & Skills

This project serves as a technical sandbox for implementing production-grade distributed systems. While the core functionality could be achieved with a simpler stack, the architecture and tools were intentionally chosen to practice microservice orchestration, stateless security, and modern developer workflows.

### Key Technical Focus:

- **Distributed Architecture:** Backend-for-Frontend (BFF) pattern with Next.js orchestrating three decoupled NestJS microservices.
- **Stateless Asymmetric Security:** RS256 JWT strategy with public/private key pairs, eliminating inter-service authentication overhead.
- **Polyglot Persistence:** PostgreSQL (Prisma) for relational integrity, MongoDB (Mongoose) for flexible user metadata.
- **System Resilience:** Multi-layered perimeter protection coupled with GDPR-compliant audit logging.
- **Monorepo Orchestration:** Turborepo within a Docker Dev Container for unified tooling and full-stack type safety.
- **Quality Assurance:** Vitest for testing, Storybook for isolated component development.

## 4. Technical Specifications & Architecture

I started with a design-first approach, building a **Figma wireframe** to validate the data model and user flows before implementation.

<p align="center" >
    <img src="assets/figma-wireframe.png" alt="Figma wireframe">
    <br>
    <i>Mobile views wireframe</i>
</p>

### 4.1 Project Architecture & Tech Stack

The system follows a decoupled microservices architecture orchestrated via Turborepo, where services are independently scalable and maintainable:

- **Frontend & Orchestrator:** Acts as the Backend-for-Frontend (BFF) and sole entry point to the microservices, aggregating data from downstream microservices.
- **Identity Provider:** Issues and manages RS256-signed JWTs for stateless authentication across the system.
- **Resource Servers:** Domain-specific services for Product data (packing lists, items) and User data (preferences, settings).
- **Infrastructure:** Containerized via Docker with a Dev Container for environment parity, designed for deployment to container-based cloud infrastructure.

<br>

| **Component**           | **Technology / Framework** | **Rationale & Key Responsibility**                                                             | **Deployment Strategy**   |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------- |
| Monorepo Manager        | Turborepo                  | Orchestrates the stack; manages shared configuration and tooling with optimized build caching. | -                         |
| Frontend & BFF          | Next.js (React/RSC)        | UI and Backend-for-Frontend; leverages Server Components for data aggregation.                 | Serverless environment    |
| Authentication          | Auth.js                    | Manages browser sessions and bridges client-side auth to the backend JWT strategy.             | Integrated in BFF         |
| Auth Service (AS)       | NestJS                     | Issues RS256 JWTs; manages user credentials, security logic, and account lifecycle.            | Containerized (Linux/VPS) |
| Product Service (PS)    | NestJS                     | Resource Server: Manages core packing list logic and relational data.                          | Containerized (Linux/VPS) |
| User Data Service (UDS) | NestJS                     | Resource Server: Manages polymorphic user metadata and preferences.                            | Containerized (Linux/VPS) |
| Primary Database        | PostgreSQL (Prisma)        | Ensures ACID compliance for relational data (AS and PS) via logically isolated schemas.        | Managed (TBD)             |
| Flexible Database       | MongoDB (Mongoose)         | Document storage for non-relational user preferences and metadata.                             | MongoDB Atlas             |
| Containerization        | Docker                     | Ensures environment parity across development and multi-cloud deployments.                     | -                         |
| Testing                 | Vitest                     | Executes unit, integration and component tests across the monorepo workspace.                  | -                         |
| Styling & UI            | Tailwind & Storybook       | Utility-first styling and isolated component-driven development.                               | -                         |

<br>
<br>

<p align="center">
    <img src="assets/architecture.png" width="1200" alt="Architecture diagram">
    <br>
    <i>System architecture</i>
</p>

### 4.2 Data Persistence (Database & ORM)

Data persistence was approached with an enterprise mindset, selecting specialized databases for specific data requirements rather than forcing a "one-size-fits-all" solution.

- **Primary Database: PostgreSQL (via Prisma).** Selected for transactional integrity and robust relationship management. Essential for Auth and Product services, where core entities require strict enforcement of referential integrity.
- **Flexible Database: MongoDB (via Mongoose).** Utilized for the User Data Service to store polymorphic user preferences. Avoids "schema-rot" in the relational database, allowing user-specific settings to evolve without complex migrations.

<br>

**Architectural Trade-off: Logical vs. Physical Isolation**

In a "Shared Nothing" production environment, each service would ideally own a dedicated physical database instance. To maintain cost-efficiency while respecting this principle, I utilized logical schema separation within a single PostgreSQL instance.
While this creates a shared failure domain at the infrastructure layer, I mitigated data-layer risk by enforcing the Principle of Least Privilege. Each microservice connects via a unique database role restricted exclusively to its own schema, preventing cross-service data leakage.

### 4.3 Authentication

The system implements a stateless, asymmetric authentication strategy designed to maximize service autonomy and minimize cross-service latency.

- **Session Management (BFF):** Auth.js bridges browser-based session management with the backend's JWT security by storing session tokens in encrypted, HTTP-only cookies, mitigating XSS-based token theft.
- **Asymmetric Identity (RS256):** The Auth Service issues a JWT token pair signed with a Private RSA Key (Access Token + Refresh Token). Downstream Resource Servers verify tokens locally using a Public Key, preventing the Auth Service from becoming a performance bottleneck.
- **Token Rotation & Reuse Detection:** Utilizes a "Refresh Token Family" pattern: every refresh issues a new token while invalidating the predecessor. If any token in the chain is reused (signaling a potential breach), the entire family is revoked. A grace period accommodates race conditions and network retries.
- **GDPR-Compliant Audit Logging:** The Auth Service maintains an immutable log of all security events with anonymized IP addresses and truncated User Agent strings (Browser/OS/Device only) before persistence.

## 5. Development Strategy & Roadmap

The project follows a backend-first approach, implementing the identity provider and resource servers first to validate the distributed architecture before building the UI.

| Phase                           | Focus                       | Rationale                                                                                                                                                |
| ------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Environment Foundation | Monorepo & Containerization | Establishes a consistent development environment with shared tooling (Turborepo, Docker, ESLint, TypeScript, Vitest).                                    |
| Phase 1: Identity Provider      | Auth Service                | Builds the security foundation first. All resource servers require JWT tokens for stateless verification, so this must exist before downstream services. |
| Phase 2: Resource Server        | Product Service             | Implements the primary business logic with relational data. Validates that resource servers can successfully verify tokens from the identity provider.   |
| Phase 3: Resource Server        | User Data Service           | Adds a second resource server with document storage. Proves the system is persistence-agnostic and that JWT verification logic is fully decoupled.       |
| Phase 4: Frontend               | Next.js BFF & UI            | Builds the presentation layer once backend APIs are stable. Avoids frontend rework by developing against a validated API contract.                       |

## 6. Implementation

### 6.1 Phase 0: Development Setup & Foundation

The first step was establishing a consistent development environment for building and testing services in isolation.

#### 6.1.1 Monorepo Configuration (Turborepo)

The monorepo was bootstrapped using a [custom Turborepo boilerplate I developed previously](https://github.com/carlfremault/turbo-tryout), which includes a frontend, backend, and shared configuration packages for TypeScript, ESLint, and Vitest.

After removing the default Express.js backend, I had a clean foundation for the NestJS microservices.

#### 6.1.2 Dev Container setup (Docker)

To ensure a consistent Developer Experience (DX) and simplify the eventual transition to production, I wrapped the entire monorepo in a Docker Dev Container. This setup automates the toolchain configuration with a "batteries included" approach:

- **Integrated Tooling:** Built from a Node 24/TypeScript base image with automated installation of Turborepo, NestJS CLI, and Yarn 4 (via Corepack).
- **Local Infrastructure:** Includes a PostgreSQL service in the Docker Compose configuration. The dev container shares the network stack with the database (`network_mode: service:postgres_db`), allowing services to connect via `localhost:5432`, matching production connection patterns and simplifying environment configuration.
- **VS Code Integration:** Automatically configures VS Code workspace settings and installs extensions (Prisma, ESLint, Tailwind) on container launch via `devcontainer.json`.

### 6.2 Phase 1: Identity Provider

#### 6.2.1 Design & Data Modeling

Before writing any code, I mapped out the authentication flow and data structures to ensure the service would be both secure and stateless.

##### Authentication Flow (Sequence Diagram)

I designed a sequence diagram to visualize the flow between the browser, BFF, and backend services. Key security boundaries include credential validation in the Auth Service, JWT wrapping in encrypted session cookies (never exposed to the browser), and stateless verification in resource servers using the public key.

<p align="center">
    <br>
    <img src="assets/authentication-sequence-diagram.png" alt="Authentication Sequence Diagram">
    <br>
    <i>Authentication Sequence Diagram</i>
</p>

##### Database Schema (ERD)

The schema defines relationships between Users, Roles, and RefreshTokens to support token family tracking and immediate revocation.

- **UUID v7 identifiers** for time-ordered database performance while maintaining global uniqueness.
- **Decoupled AuditLog table** (no foreign keys) to preserve log immutability even after user deletion.
- **Salted password hashes** to ensure no plaintext credentials exist in the database.
- **VerificationToken table** for time-limited, single-use tokens supporting password reset and account deletion workflows.

<p align="center">
    <br>
    <img src="assets/auth-erd.png" alt="Auth Service Entity Relationship Diagram">
    <br>
    <i>Auth Service Entity Relationship Diagram</i>
</p>

#### 6.2.2 Bootstrapping & Monorepo Integration

After generating the service with the NestJS CLI, I aligned it with the monorepo architecture:

- **Configuration Alignment:** Extended shared TypeScript and ESLint packages to ensure consistent linting and compiler settings across microservices.
- **Vitest Migration:** Replaced the default Jest setup with Vitest for better monorepo performance and native ESM support.
- **Turborepo Integration:** Added the service to the Turborepo pipeline, enabling root-level commands (`dev`, `build`, `test`) to manage all workspace packages.
- **API Documentation & Type Safety:** Integrated Swagger with full endpoint annotations. Generated an OpenAPI spec to automatically create a typed HTTP client as a shared monorepo package, ensuring type-safe API consumption across services.

To avoid repeating this manual configuration, the service was cloned twice to bootstrap the Product and User Data Services (Phases 2-3).

#### 6.2.3 Infrastructure & Security Setup

With the foundation ready, I configured the service infrastructure:

- **Prisma Initialization:** Connected Prisma to the local PostgreSQL container and pushed initial migrations to establish the user tables.
- **Cryptographic Keys:** Generated an RSA key pair for RS256 signing. The Private Key remains isolated to the Auth Service, while the Public Key is shared with resource servers for token verification. Both are injected via environment variables.

#### 6.2.4 Service Implementation

With the infrastructure in place, I built a robust API following NestJS best practices, prioritizing security and observability.

##### Authentication Flow

Manual RS256 token signing was implemented for outbound logic, Passport.js strategies for inbound verification (Access and Refresh strategies). The system supports full lifecycle management: registration, login, token rotation with "family" tracking, and global sign-out.
To handle edge cases like concurrent requests and reuse attacks, I designed the following decision matrix for refresh token validation:

| **Scenario**             | **Stored Token Status (isRevoked)**         | **Within Grace Period** | **Action**                                                                            | **Client Message** | **Internal log**                             | **AuditLog EventType**         |
| ------------------------ | ------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------- | ------------------------------ |
| Normal refresh           | Valid (not revoked, not expired)            | N/A                     | Rotate token, create new one in same family                                           | N/A                | N/A                                          | TOKEN REFRESHED                |
| Race condition           | Revoked                                     | Yes                     | Query latest valid token in family. Return JWTs with latest token's JTI (no DB write) | N/A                | Race condition handled: user [ID]            | TOKEN REFRESHED RACE CONDITION |
| Token reuse attack       | Revoked AND has `replacedById`              | No                      | Revoke all tokens in family. Log security alert. Throw exception                      | "Session expired”  | Critical: Token reuse detected for user [ID] | TOKEN REUSE DETECTED           |
| Manual logout            | Revoked AND no `replacedById`               | Yes                     | Throw exception                                                                       | "Session expired”  | N/A                                          | SESSION EXPIRED                |
| Manual logout            | Revoked AND no `replacedById`               | No                      | Throw exception                                                                       | "Session expired”  | Refresh attempt on logged-out session        | SESSION EXPIRED                |
| Token not found in DB    | NULL                                        | N/A                     | Log warning. Throw exception                                                          | "Access Denied”    | Warn: Refresh token [ID] not found in DB     | INVALID SESSION                |
| Token ownership mismatch | Found but `userId` or `family` mismatch     | N/A                     | Log security error. Throw exception                                                   | "Access Denied”    | Security: User [ID] mismatch for token [ID]  | INVALID SESSION                |
| Token expired in DB      | Valid (not revoked) but `expiresAt < now()` | N/A                     | Throw exception                                                                       | "Session expired”  | N/A                                          | SESSION EXPIRED                |
| JWT expired              | N/A (never reaches service)                 | N/A                     | Passport strategy rejects. Returns 401 before service method called                   | "Unauthorized”     | N/A                                          | SESSION EXPIRED                |

<p align="center">
    <br>
    <img src="assets/refreshtoken-flow-diagram.png" alt="Refresh token Flow Diagram">
    <br>
    <i>Refresh token decision flow visualizing the scenarios above</i>
</p>

##### Account Lifecycle & Recovery

- **Forgot Password:** Implements a time-limited password reset flow using hashed verification tokens (15-minute expiration). Prevents user enumeration by returning generic success messages regardless of email existence.
- **Account Deletion:** Supports GDPR-compliant user deletion with a 30-day grace period. Users receive a verification token via email to cancel deletion before final anonymization of audit logs and hard deletion of user data.
- **Email Notifications:** Implemented email delivery for password reset and account deletion flows using Nodemailer with server-side template rendering.

##### Network Security

- **BFF Guard (Service-to-Service):** To protect internal microservices from direct access in cloud environments where dynamic IP allocation prevents traditional IP whitelisting, I implemented a shared-secret header requirement. Any request bypassing the Next.js BFF is immediately rejected.
- **Intelligent Throttling:** Custom `ThrottlerGuard` differentiates between anonymous (IP-based) and authenticated (user ID-based) requests. This prevents users behind NAT from being penalized while protecting against proxy-rotation attacks.
- **Strict CORS Policy:** Production API is locked to only accept requests from the Next.js BFF, prohibiting direct browser-to-API communication.
- **Global Exception Filtering:** System-wide filter ensures the API always returns consistent JSON structures instead of HTML error pages or stack traces that could reveal internal file paths.

##### Audit & Observability

- **Comprehensive Coverage:** Custom exception filters and an `AuditInterceptor` record every interaction (successes, errors, throttled requests). I chose NestJS Interceptors over Middleware because interceptors execute after route resolution and can access both request/response data and custom decorator metadata (e.g., `@AuditLog('LOGIN_SUCCESS')`), enabling richer event logging.
- **Information Sanitization:** Internal logs capture detailed events (`TOKEN_REUSE_DETECTED`) while clients receive sanitized messages (`Session Expired`).
- **Async Performance:** Logs are dispatched asynchronously via NestJS EventEmitter to prevent blocking user requests.
- **GDPR Compliance:** IP addresses are anonymized and User Agent data is limited to browser/OS/device. User deletion requests trigger a 30-day soft-delete period before final anonymization of audit logs.
- **Error Tracking:** Integrated Sentry for production error monitoring without transmitting PII. Each request receives a unique ID via middleware, allowing correlation between Sentry alerts and audit logs for debugging.

##### Scheduled Maintenance

Daily cron jobs clean up expired data with configurable retention periods:

- **Refresh Tokens:** Expired tokens deleted immediately; revoked tokens after 14 days.
- **Audit Logs:** INFO (30 days), WARN/ERROR (60 days), CRITICAL (90 days).
- **Deleted Users:** Final deletion and log anonymization after 30-day grace period.
- **Verification Tokens:** Expired tokens deleted after 1 day, used tokens deleted immediately.

##### Testing & Quality Assurance

Implemented comprehensive test coverage across unit and integration scenarios using Vitest. This prevented regressions during subsequent feature development, particularly when adding the token family rotation and audit logging systems.

### 6.3 Phase 2: Resource Server (Product Service)

#### 6.3.1 Shared Package Extraction

Before building the Product Service, two pieces of infrastructure were extracted from the Auth Service into shared monorepo packages to avoid duplication and establish a consistent foundation for all downstream services.

##### @repo/db — Shared Database Package

The original Prisma setup lived inside the Auth Service. As the Product Service would share the same PostgreSQL instance (different schema, same host), the entire database layer was moved to a dedicated `db` package: schema definitions, generated Prisma client, migration scripts, and the database seed.

This surfaced a permissions issue that had been dormant in the Auth Service: migrations were running under the Auth Service's database role, which only holds privileges on the `app_auth` schema. That role has no business touching `app_product` tables. The database setup script was corrected to grant each service's role privileges exclusively to its own schema, enforcing the Principle of Least Privilege at the migration level, not just at query time.

##### @repo/nestjs-common — Shared NestJS Package

The Auth Service had accumulated a collection of NestJS infrastructure components that every resource server would need. Rather than copy-pasting them, they were migrated to a shared `nestjs-common` package:

- **Guards:** `BffGuard` (shared-secret enforcement), `JwtAuthGuard` (RS256 token verification), `CustomThrottlerGuard` (user-aware rate limiting)
- **Strategies:** Passport JWT strategy for access token verification
- **Decorators:** `@CurrentUser()` for extracting the authenticated user from the request context, `@ApiBffAndAccessSecurity()` for consistent Swagger security annotations
- **Modules:** `JwtAuthModule`, `CustomThrottlerModule`, `BffGuardModule` — thin NestJS wrappers that register the guards and strategies as providers, making them available to the consuming service's DI container
- **Exceptions & Filters:** `GlobalExceptionFilter` base class and `PrismaExceptionFilter` base class, both extensible per service
- **Utilities:** `RequestId` middleware, Sentry initialization helper, Swagger spec generation script, utils and helper functions
- **Testing helpers:** JWT generation utility for signing test tokens against the service's RSA key pair

#### 6.3.2 Design & Data Modeling

##### Database Schema (ERD)

The Product Service manages all packing-related entities. The schema centers on three primary models — `Item`, `List`, and `Pack` — connected through explicit junction tables that carry their own payload (`quantity`).

- **`Category`** groups items. Optional: items have a nullable FK to category.
- **`Item`** is the atomic unit. Linked to a category (optional).
- **`List`** is a reusable collection of items, assembled via the `ItemList` junction table.
- **`Pack`** is the final compiled list for a specific trip context. Items can be added directly via `ItemPack`, or indirectly by including entire Lists via `ListPack`. Both junction tables carry a `quantity` field.
- **`Trip`** references a single Pack via a foreign key.

All entities carry a `userId` field. Ownership is enforced at the service layer on every read and write operation.

<p align="center">
    <br>
    <img src="assets/product-erd.png" alt="Product Service Entity Relationship Diagram">
    <br>
    <i>Product Service Entity Relationship Diagram</i>
</p>

#### 6.3.3 Service Implementation

The Product Service was bootstrapped by cloning the Auth Service (as noted at the end of Phase 1), which provided the wired-up monorepo configuration and a clean NestJS scaffold. Authentication, throttling, and BFF guard modules were wired in from the `nestjs-common` package.

##### CRUD Operations

All seven modules — `Category`, `Item`, `List`, `Pack`, `Trip`, `ItemList`, `ItemPack`, and `ListPack` — expose standard Create, Read, and Update routes. Responses are shaped using `class-transformer` DTOs (`@Expose()` / `@Exclude()`) to control exactly what reaches the client, including nested relations where relevant (e.g., a List response includes its items and an item count).

Create and Update operations run inside Prisma transactions where multiple checks are required — for example, creating an Item validates that the provided `categoryId` belongs to the same user before connecting it.

**UUID v7 identifiers** are used across all entities, consistent with the Auth Service. IDs are generated in application code (not delegated to the database), and all `id` route parameters are validated with `ParseUUIDPipe({ version: '7' })` before reaching the service layer.

##### Delete & Dependency Resolution

Delete is intentionally not a simple `DELETE /:id`. The dependency graph runs deep: removing a List will cascade through `ListPack` to Packs, and from there to Trips. Removing an Item can affect ItemList, ItemPack, Packs, and Trips. A client cannot reasonably track these implications on its own.

To address this, every deletable entity exposes a `GET /:id/delete-impact` route that traverses the dependency graph and returns all affected records without modifying any data. The client calls this first, presents the consequences to the user, and only proceeds to `DELETE /:id` on confirmation.

For each entity, the delete impact query resolves what the user needs to be informed about before proceeding:

| **Entity deleted** | **Impact reported**                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Category           | Items that will lose their category assignment (`categoryId` nulled, items not deleted)                   |
| Item               | Lists and Packs containing this item (`Restrict` — delete blocked until removed); Trips using those Packs |
| List               | Packs containing this List (`Restrict` — delete blocked until removed); Trips using those Packs           |
| Pack               | Trips that will lose their Pack reference (`packId` nulled, Trips not deleted)                            |
| Trip               | No downstream impact                                                                                      |

##### Exceptions & Observability

The service extends `nestjs-common`'s base exception classes with a `PrismaExceptionFilter` that maps Prisma error codes (unique constraint violations, foreign key errors, record-not-found) to appropriate HTTP responses. A `GlobalExceptionsFilter` filter catches everything else, ensuring the API never leaks stack traces or internal paths to the client. Sentry is integrated for production error monitoring using the shared utility from `nestjs-common`. Unlike the Auth Service, the Product Service does not implement audit logging for CRUD operations. Error tracking via Sentry is sufficient for observability given the lower compliance requirements.

#### 6.3.4 Testing & Quality Assurance

The Product Service holds the core business logic of the application. A regression here has wider consequences than in the Auth Service, where most flows are independently verifiable. Comprehensive test coverage was a prerequisite before moving on.

**Unit tests** cover all services in isolation, mocking the Prisma layer and verifying that service methods call the correct queries.

**Integration / E2E tests** run against a real database using the same PostgreSQL container available in the Dev Container. Each module has a dedicated test suite:

`category`, `item`, `list`, `pack`, `trip`, `item-list`, `item-pack`, `list-pack`

Tests cover the full CRUD surface including ownership enforcement (a user cannot access another user's resources), not-found handling, invalid UUID rejection, and the delete impact traversal logic. Shared fixtures and helpers keep test setup consistent and readable and avoid boilerplate duplication across suites.

#### 6.3.5 API Documentation & Client Generation

Following the same pattern established in Phase 1, Swagger annotations (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) were applied to all controllers and DTOs. The OpenAPI spec was exported and used to generate a typed HTTP client published in the `product-client` package, giving the future BFF (Next.js) type-safe access to the Product Service API from day one.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Copyright (c) 2025 Carl Fremault

---
