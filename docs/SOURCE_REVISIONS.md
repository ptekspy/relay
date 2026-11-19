# Source revisions

Relay started as a standalone snapshot of several source trees. The product specifications describe intended behavior across several releases.

| Revision | What it contains | Where it fits here |
| --- | --- | --- |
| `355dbcb98de14b76531f2a3bbe02c302a80e8340` | CLI and gateway, protocol, clients, API, cloud edge, dashboards, shared dependencies, examples and tests | Runtime and development workspace |
| `81dc11d4111c5833df539d83c51894709aff9835` | Standalone public Next.js website, product specification and use-case catalogue | Public site in `sites/public` and product documents in `docs/` |
| `87f4c6504190b6a68b66bad34dfe0d27a8e16e4e` | Earlier Vite product website | Caption fix `f6d664b53c653f121cd9ca9293f0930dc2c4f404` carried into both code block components |
| `9eb58d8ee8500a6cdd2452b4190e1adc911af256` | Nx/NestJS API and web scaffolding, with placeholders for the CLI and mobile apps | Historical scaffold |
| Intermediate website revision | Shared website components and web application | Historical website revision |

The public website has its own workspace and can run independently. The original release workflow was tag-triggered. Package publishing and deployments are not configured for this repository.
