# Source revisions

This repository starts with a standalone snapshot. The links below point to the original revisions and their Git histories. The product specifications describe intended behavior across several releases.

| Source revision | What it contains | Where it fits here |
| --- | --- | --- |
| [Paddy-Systems/p-s-core at 355dbcb](https://github.com/Paddy-Systems/p-s-core/tree/355dbcb98de14b76531f2a3bbe02c302a80e8340) | CLI and gateway, protocol, clients, API, cloud edge, dashboards, shared dependencies, examples and tests | Runtime and development workspace. [Original commit history](https://github.com/Paddy-Systems/p-s-core/commits/355dbcb98de14b76531f2a3bbe02c302a80e8340/apps/relay/) |
| [Paddy-Systems/relay at 81dc11d](https://github.com/Paddy-Systems/relay/tree/81dc11d4111c5833df539d83c51894709aff9835) | Standalone public Next.js website, product specification and use-case catalogue | Public site in `sites/public`; product documents in `docs/` |
| [Paddy-Systems/paddy-systems-relay-web at 87f4c65](https://github.com/Paddy-Systems/paddy-systems-relay-web/tree/87f4c6504190b6a68b66bad34dfe0d27a8e16e4e) | Earlier Vite product website | The October [caption fix](https://github.com/Paddy-Systems/paddy-systems-relay-web/commit/f6d664b53c653f121cd9ca9293f0930dc2c4f404) is carried into each copy of the code block component. |
| [Paddy-Systems/nx-ps-suite at 9eb58d8](https://github.com/Paddy-Systems/nx-ps-suite/tree/9eb58d8ee8500a6cdd2452b4190e1adc911af256/apps/relay) | Nx/NestJS API and web scaffolding, with placeholders for the CLI and mobile apps | Historical scaffold |
| [Paddy-Systems/Paddy-Systems-LTD](https://github.com/Paddy-Systems/Paddy-Systems-LTD/tree/main/relay) | Intermediate shared website components and web application | Historical website revision |

The workspace keeps the original package names, directory layout for the runtime, and Paddy Systems licence notices. The older public pages inside the cloud and local dashboards belong to those applications. The dedicated public website has its own workspace and can run independently.

The original tag-triggered [release workflow](https://github.com/Paddy-Systems/p-s-core/blob/355dbcb98de14b76531f2a3bbe02c302a80e8340/.github/workflows/relay-release.yml) targeted the organisation repository. Package publishing and deployments have not been configured for this repository.
