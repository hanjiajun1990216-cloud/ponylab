# PonyLab — System Security Plan (SSP)

## FedRAMP Compliance Template

**System Name**: PonyLab ELN/LIMS
**Version**: 3.0
**Date**: 2026-03-06
**Classification**: Moderate (FIPS 199)

---

### 1. System Overview

PonyLab is an Electronic Lab Notebook (ELN) and Laboratory Information Management System (LIMS) designed for scientific research teams. The system manages experiments, protocols, samples, instruments, and inventory with full audit trail compliance.

### 2. System Architecture

| Component      | Technology               | Purpose                  |
| -------------- | ------------------------ | ------------------------ |
| API Server     | NestJS 11 + TypeScript   | REST API, business logic |
| Database       | PostgreSQL 16            | Persistent data storage  |
| Web Client     | Next.js 15 + React 19    | User interface           |
| Authentication | Passport.js + JWT + SAML | Identity management      |
| Mobile Client  | Capacitor (iOS/Android)  | Native mobile access     |

### 3. Security Controls (NIST 800-53 Rev.5)

#### AC — Access Control

| Control                   | Status         | Implementation                                                      |
| ------------------------- | -------------- | ------------------------------------------------------------------- |
| AC-2 Account Management   | ✅ Implemented | User CRUD with role-based activation/deactivation                   |
| AC-3 Access Enforcement   | ✅ Implemented | RBAC with PermissionGuard on all endpoints                          |
| AC-5 Separation of Duties | ✅ Implemented | Signer ≠ Witness enforcement in experiment workflow                 |
| AC-6 Least Privilege      | ✅ Implemented | Granular permissions: experiment:read/write, instrument:admin, etc. |
| AC-7 Unsuccessful Login   | ⬜ Planned     | Account lockout after N failed attempts                             |
| AC-11 Session Lock        | ✅ Implemented | JWT 15-min access token expiration                                  |
| AC-17 Remote Access       | ✅ Implemented | HTTPS-only, IP whitelist middleware                                 |

#### AU — Audit and Accountability

| Control                       | Status         | Implementation                                                                     |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| AU-2 Audit Events             | ✅ Implemented | All CRUD + sign/witness/login/register events logged                               |
| AU-3 Content of Audit Records | ✅ Implemented | userId, action, entityType, entityId, oldValue, newValue, IP, userAgent, timestamp |
| AU-6 Audit Review             | ✅ Implemented | Admin audit log viewer with filtering                                              |
| AU-9 Protection of Audit Info | ✅ Implemented | SHA-256 hash chain (21 CFR Part 11), verify-chain endpoint                         |
| AU-10 Non-repudiation         | ✅ Implemented | Password-confirmed electronic signatures                                           |

#### IA — Identification and Authentication

| Control                       | Status         | Implementation                      |
| ----------------------------- | -------------- | ----------------------------------- |
| IA-2 Multi-factor Auth        | ⬜ Planned     | SAML SSO configured, MFA via IdP    |
| IA-5 Authenticator Management | ✅ Implemented | bcrypt (12 rounds) password hashing |
| IA-8 Identification (Non-org) | ✅ Implemented | SAML SSO for federated identity     |

#### SC — System and Communications Protection

| Control                            | Status         | Implementation                        |
| ---------------------------------- | -------------- | ------------------------------------- |
| SC-8 Transmission Confidentiality  | ✅ Implemented | HTTPS/TLS enforced                    |
| SC-12 Cryptographic Key Management | ✅ Implemented | JWT secrets via environment variables |
| SC-13 Cryptographic Protection     | ✅ Implemented | bcrypt, SHA-256, HMAC-SHA256          |
| SC-28 Protection of Data at Rest   | ⬜ Planned     | PostgreSQL encryption at rest         |

#### SI — System and Information Integrity

| Control                            | Status         | Implementation                                |
| ---------------------------------- | -------------- | --------------------------------------------- |
| SI-2 Flaw Remediation              | ⬜ Planned     | Automated dependency scanning                 |
| SI-4 Information System Monitoring | ✅ Implemented | Webhook notifications for critical events     |
| SI-10 Information Input Validation | ✅ Implemented | class-validator DTOs, Zod frontend validation |

### 4. Continuous Monitoring

- Audit log hash chain verification (scheduled)
- Notification preferences per user
- Webhook dispatch for external monitoring integration

### 5. Incident Response

| Phase           | Procedure                                      |
| --------------- | ---------------------------------------------- |
| Detection       | Audit log anomaly detection + webhook alerts   |
| Analysis        | Audit trail review with entity-level filtering |
| Containment     | IP whitelist lockdown + user deactivation      |
| Recovery        | Version history rollback + snapshot restore    |
| Lessons Learned | Audit log export for post-incident analysis    |
