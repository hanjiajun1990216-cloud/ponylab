# PonyLab — Plan of Action and Milestones (POA&M)

## FedRAMP Remediation Tracking

**System**: PonyLab ELN/LIMS v3.0
**Last Updated**: 2026-03-06

---

| #   | Finding                         | Control | Severity | Status | Target Date | Owner        | Notes                                         |
| --- | ------------------------------- | ------- | -------- | ------ | ----------- | ------------ | --------------------------------------------- |
| 1   | Account lockout not implemented | AC-7    | High     | Open   | 2026-04-15  | Backend Team | Progressive lockout: 5 attempts → 15 min lock |
| 2   | Native MFA (TOTP)               | IA-2    | Medium   | Open   | 2026-05-01  | Auth Team    | SAML IdP MFA available as interim             |
| 3   | Database encryption at rest     | SC-28   | Medium   | Open   | 2026-04-30  | DevOps       | Use cloud provider disk encryption            |
| 4   | Automated dependency scanning   | SI-2    | Low      | Open   | 2026-04-01  | DevOps       | Add Dependabot to GitHub repo                 |
| 5   | Session timeout configuration   | AC-12   | Low      | Open   | 2026-04-15  | Backend Team | Configurable JWT expiration                   |
| 6   | Log retention policy            | AU-11   | Low      | Open   | 2026-05-15  | DevOps       | 7-year retention for 21 CFR Part 11           |
| 7   | Security training documentation | AT-2    | Low      | Open   | 2026-06-01  | Compliance   | Annual security awareness training            |

---

### Milestones

| Milestone | Date       | Deliverable                           |
| --------- | ---------- | ------------------------------------- |
| M1        | 2026-04-01 | Dependabot + account lockout deployed |
| M2        | 2026-05-01 | TOTP MFA + DB encryption completed    |
| M3        | 2026-06-01 | Full POA&M remediation complete       |
| M4        | 2026-07-01 | Annual security review                |
