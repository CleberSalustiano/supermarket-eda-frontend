#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: ./scripts/start-app.sh <app> [mode]"
  echo "Examples:"
  echo "  ./scripts/start-app.sh management-web dev"
  echo "  ./scripts/start-app.sh checkout preview"
  echo "  ./scripts/start-app.sh mobile"
  exit 1
fi

app_alias="$1"
mode="${2:-dev}"

workspace_name=""

case "$app_alias" in
  management|management-web)
    workspace_name="@supermarket/management-web"
    ;;
  checkout|checkout-web)
    workspace_name="@supermarket/checkout-web"
    ;;
  inventory|inventory-web)
    workspace_name="@supermarket/inventory-web"
    ;;
  mobile|operations-mobile)
    workspace_name="@supermarket/operations-mobile"
    ;;
  *)
    echo "Unknown app: $app_alias"
    exit 1
    ;;
esac

if [[ "$workspace_name" == "@supermarket/operations-mobile" && "$mode" == "preview" ]]; then
  echo "Preview mode is not supported for operations-mobile. Use dev, ios, or android."
  exit 1
fi

case "$mode" in
  dev|preview|ios|android)
    npm run "$mode" --workspace "$workspace_name"
    ;;
  *)
    echo "Unsupported mode: $mode"
    echo "Allowed modes: dev, preview, ios, android"
    exit 1
    ;;
esac
