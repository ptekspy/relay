# Relay

Relay lets a developer open a service running on their machine from another device. The CLI starts a gateway in front of the local service. A receiver pairs with the session and uses the gateway to reach the running application.

## Run from source

Use Node.js 24 or newer and Bun 1.4.0. From the repository root, install dependencies and check the CLI:

```sh
bun install --frozen-lockfile
bun run relay --help
```

With a development server already listening on port 3000, run this in a second terminal:

```sh
bun run relay 3000 --no-browser
```

Follow the pairing instructions in the terminal on a device that can reach your development machine. Substitute your service's port for 3000.

For local HTTPS, supply a certificate and key through `RELAY_LAN_TLS_CERT` and `RELAY_LAN_TLS_KEY`, or make `openssl` available on your path so Relay can generate a development certificate. The default HTTP workflow does not require OpenSSL.

## Verify the gateway

```sh
bun run test:gateway
```

These tests start a local HTTP server and a Relay gateway. They exercise unauthenticated requests, token-to-cookie pairing, and forwarding a request to the underlying app.

## Where to work

| Area | Location |
| --- | --- |
| CLI, pairing and local proxy | [apps/relay/cli](apps/relay/cli) |
| API, cloud edge, local and cloud dashboards | [apps/relay](apps/relay) |
| Android, desktop, browser and editor clients | [apps/relay](apps/relay) |
| Protocol, transport, security, replay and testing libraries | [packages/relay](packages/relay) |
| Framework examples and end-to-end journeys | [apps/examples](apps/examples) · [test/e2e/user-journeys](test/e2e/user-journeys) |
| Public product website | [sites/public](sites/public) |
| Product specification and user journeys | [Specification](docs/PRODUCT_SPECIFICATION.md) · [User journeys](docs/USER_JOURNEYS.md) |

Run `bun run dev:site` to work on the public website. See the [source revisions](docs/SOURCE_REVISIONS.md) for the original commits and the scope of this extraction.

## License

Relay is licensed under the [Apache License, Version 2.0](LICENSE).

Copyright 2026 Paddy Systems LTD. See [NOTICE](NOTICE) for attribution.
