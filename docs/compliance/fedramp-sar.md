# PonyLab — Security Assessment Report (SAR)

## FedRAMP Assessment Template

**System**: PonyLab ELN/LIMS v3.0
**Assessment Date**: 2026-03-06
**Assessor**: [Organization Name]

---

### 1. Executive Summary

This report documents the security assessment of PonyLab ELN/LIMS v3.0 against NIST 800-53 Rev.5 controls at the Moderate impact level.

### 2. Assessment Scope

| Area             | Components Assessed                         |
| ---------------- | ------------------------------------------- |
| Authentication   | Local auth, JWT, SAML SSO                   |
| Authorization    | RBAC, PermissionGuard, role hierarchy       |
| Audit Trail      | AuditLog model, hash chain, verify-chain    |
| Data Integrity   | Electronic signatures, lockedAt enforcement |
| Network Security | IP whitelist, HTTPS                         |
| Input Validation | DTO validation, Zod schemas                 |

### 3. Findings Summary

| Severity | Count | Description                                                |
| -------- | ----- | ---------------------------------------------------------- |
| Critical | 0     | —                                                          |
| High     | 1     | Account lockout not yet implemented (AC-7)                 |
| Medium   | 2     | MFA depends on external IdP; DB encryption at rest pending |
| Low      | 1     | Automated dependency scanning not configured               |

### 4. Detailed Findings

#### Finding 1: Account Lockout (High)

- **Control**: AC-7
- **Status**: Not Implemented
- **Risk**: Brute force password attacks
- **Recommendation**: Implement progressive lockout (5 failed attempts → 15 min lockout)
- **Mitigation**: IP whitelist partially mitigates; SAML SSO delegates to IdP lockout policy

#### Finding 2: Multi-Factor Authentication (Medium)

- **Control**: IA-2
- **Status**: Partially Implemented (via SAML IdP)
- **Recommendation**: Implement TOTP as native MFA option

#### Finding 3: Encryption at Rest (Medium)

- **Control**: SC-28
- **Status**: Not Implemented
- **Recommendation**: Enable PostgreSQL TDE or use cloud provider disk encryption

#### Finding 4: Dependency Scanning (Low)

- **Control**: SI-2
- **Status**: Not Implemented
- **Recommendation**: Add Dependabot or Snyk to CI pipeline

### 5. Overall Assessment

PonyLab v3.0 demonstrates strong security posture for a laboratory information system:

- **21 CFR Part 11 compliance**: Full electronic signature workflow with password verification and tamper-evident audit trail
- **RBAC**: Fine-grained permission system covering all API endpoints
- **Audit**: Comprehensive logging with SHA-256 hash chain integrity
- **Network**: IP whitelist and SAML SSO capabilities

**Recommendation**: Approve with conditions (address High finding within 90 days)
