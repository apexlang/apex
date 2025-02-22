#!/bin/sh
# deno install mocker
exec deno run -A --unstable-worker-options './mod.ts' "$@"
