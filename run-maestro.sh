#!/usr/bin/env bash
# Run the Maestro flows. Pass a folder to run just one, e.g.
#   bash run-maestro.sh .maestro/07-bottom-tabs
# NOTE: the installed app is a DEBUG build, so Metro must be running first:
#   yarn start   (or: npx expo start)   in another terminal.
#
# APP_ID selects the platform target (flows use `appId: ${APP_ID}`):
#   iOS:      APP_ID=org.improvingyouthjustice.reentryroadmap bash run-maestro.sh
#   Android:  bash run-maestro.sh        (defaults to the Android package below)
set -uo pipefail
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}"
export APP_ID="${APP_ID:-com.draftbitbuildservices.newapp}"
# First arg = path (default: whole suite). Any further args pass straight to maestro,
# e.g. bash run-maestro.sh .maestro --exclude-tags=has-areas
PATH_ARG="${1:-.maestro}"; shift || true
exec maestro test -e APP_ID="$APP_ID" "$@" "$PATH_ARG"
