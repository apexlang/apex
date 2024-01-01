#!/bin/sh
# deno install mocker
exec deno run --allow-all './apex.ts' "$@"
