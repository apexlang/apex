#!/bin/sh
# deno install mocker
exec deno run -A --config deno.json --unstable-worker-options './mod.ts' "$@"
