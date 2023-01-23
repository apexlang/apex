#!/bin/sh
# deno install mocker
exec deno run --allow-all --unstable './apex.ts' "$@"
