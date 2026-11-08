#!/usr/bin/env bash
set -euo pipefail

echo "======================================================"
echo "Relay Firewall Multi-OS Containerized Integration Suite"
echo "======================================================"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(cd "$DIR/../.." && pwd)"

echo "--> [1/2] Building and testing Ubuntu (UFW)..."
docker build -t relay-ufw-test -f "$DIR/Dockerfile.ubuntu-ufw" "$CLI_ROOT"
docker run --rm --cap-add=NET_ADMIN relay-ufw-test

echo "--> [2/2] Building and testing Fedora (firewalld)..."
docker build -t relay-firewalld-test -f "$DIR/Dockerfile.fedora-firewalld" "$CLI_ROOT"
docker run --rm --cap-add=NET_ADMIN relay-firewalld-test

echo "======================================================"
echo "All Linux firewall container tests passed successfully!"
echo "======================================================"
