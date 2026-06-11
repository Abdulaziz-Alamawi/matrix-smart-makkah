# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Active |

## Reporting a Vulnerability

If you discover a security vulnerability in **Matrix Smart Makkah**, please report it responsibly.

**Do not** open a public GitHub issue for security-sensitive findings.

Contact the maintainer: **Abdulaziz AlAmawi** via https://github.com/Abdulaziz-Alamawi

Please include a description, reproduction steps, and suggested remediation.

## Security Practices

- No secrets in source control (`.env` is gitignored)
- Environment-based configuration at runtime
- Input validation via Pydantic and Zod
- Non-root Docker containers
- Regular dependency updates

---

(c) 2026 Abdulaziz AlAmawi
