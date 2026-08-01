# Security Policy

## Supported Versions

We currently provide security updates for the following versions of NotterPad:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of NotterPad seriously. If you discover a security vulnerability, please do NOT report it by opening a public GitHub issue. Instead, please report it via private email or our designated security contact (please check the repository maintainers for contact details).

We will try to respond to your report within 48 hours and work with you to understand and resolve the issue.

## Local Data Privacy Guarantee

NotterPad is designed with privacy and security as primary considerations:

- **Local Storage**: All user data, including notes, chats, and configurations, is stored locally in your browser's IndexedDB. No personal data is sent to or stored on any central server maintained by NotterPad.
- **BYOK (Bring Your Own Key) Security**: Any API keys provided for AI integrations are stored securely in your browser's `localStorage`. They are **never** sent to any external servers, except directly to the respective AI provider's API endpoints when making requests. 
- **Telemetry**: We do not collect personally identifiable information (PII) or note content. Any telemetry (if implemented) will be opt-in and restricted to anonymous usage statistics.

Thank you for helping keep NotterPad secure!
