# Viva Voce / Examiner Questions

Use these notes to answer questions during your project presentation.

## Q1: What is a Service Mesh?
**Answer**: It's a dedicated infrastructure layer for handling service-to-service communication. It manages traffic, security, and observability without changing the application code.

## Q2: Why do we need a Sidecar Proxy?
**Answer**: To decouple networking logic from business logic. Instead of writing retry logic or circuit breakers inside every microservice (which might be in different languages), we put it in the Sidecar. The service just talks to localhost.

## Q3: How does your Circuit Breaker work?
**Answer**: It implements a state machine:
*   **Closed**: Normal operation.
*   **Open**: When failures exceed a threshold (e.g., 3), it stops traffic to prevent cascading failures.
*   **Half-Open**: After a timeout, it lets one request through to test if the service has recovered.

## Q4: How is configuration propagated?
**Answer**: I implemented a **Watcher Service** using MongoDB Change Streams. When the database changes, the Watcher pushes the new config to all active Sidecars via a webhook (`/config/update`). This ensures real-time convergence.

## Q5: Why Node.js for this?
**Answer**: Node.js is event-driven and non-blocking, making it excellent for building proxies and handling many concurrent connections, which is what a Service Mesh does.

## Q6: What is the "Control Plane" vs "Data Plane"?
**Answer**: 
*   **Control Plane**: The brain. It sets policies (e.g., "Retry 3 times").
*   **Data Plane**: The muscle. The sidecars that actually handle the packets and enforce the policies.

## Q7: How does this differ from Istio?
**Answer**: This is a simplified "Mini" version. Istio uses Envoy (C++) for sidecars and complex gRPC protocols. I built the sidecars in Node.js for educational clarity to understand the *concepts* rather than just using a tool.
