#!/usr/bin/env bash
set -euo pipefail

# Relay Network Chaos Simulator
# Uses Linux tc (Traffic Control) netem or provides simulated proxy parameters

PROFILE="${1:-help}"
INTERFACE="${2:-lo}"

show_help() {
  cat << EOF
Relay Network Chaos Simulator

Usage:
  ./scripts/simulate-network-chaos.sh <profile> [interface]

Profiles:
  3g          High latency (250ms), low bandwidth, 1% packet loss
  slow-wifi   Moderate latency (80ms), 20ms jitter, 2% packet loss
  flaky       Frequent drops (10% packet loss), 150ms delay
  reset       Clear all netem rules from target interface
  help        Show this help message

Interface:
  Default is 'lo' (loopback for local dev server testing).

Examples:
  sudo ./scripts/simulate-network-chaos.sh 3g lo
  sudo ./scripts/simulate-network-chaos.sh reset lo
EOF
}

check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Error: Modifying network queues with 'tc' requires root / sudo privileges." >&2
    exit 1
  fi
}

clear_rules() {
  echo "[chaos] Clearing netem qdisc rules on interface '${INTERFACE}'..."
  tc qdisc del dev "${INTERFACE}" root 2>/dev/null || true
  echo "[chaos] ✓ Network rules reset to normal."
}

case "${PROFILE}" in
  reset)
    check_root
    clear_rules
    ;;

  3g)
    check_root
    clear_rules
    echo "[chaos] Applying 3G simulation: 250ms delay, 1% loss..."
    tc qdisc add dev "${INTERFACE}" root netem delay 250ms 30ms distribution normal loss 1%
    echo "[chaos] ✓ 3G network simulation active."
    ;;

  slow-wifi)
    check_root
    clear_rules
    echo "[chaos] Applying Slow Wi-Fi simulation: 80ms delay, 20ms jitter, 2% loss..."
    tc qdisc add dev "${INTERFACE}" root netem delay 80ms 20ms loss 2%
    echo "[chaos] ✓ Slow Wi-Fi network simulation active."
    ;;

  flaky)
    check_root
    clear_rules
    echo "[chaos] Applying Flaky connection: 150ms delay, 10% packet loss..."
    tc qdisc add dev "${INTERFACE}" root netem delay 150ms 50ms loss 10%
    echo "[chaos] ✓ Flaky connection simulation active."
    ;;

  help|--help|-h)
    show_help
    ;;

  *)
    echo "Unknown profile '${PROFILE}'."
    show_help
    exit 1
    ;;
esac
