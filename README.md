# Apex CLI

WIP

## Sample Usage

```shell
$ cd example
$ APEX_LOG=debug deno run --allow-read --allow-write --allow-env --allow-net --allow-run --unstable ../apex.ts generate apex.yaml
```

## Running tests

```shell
$ deno test --allow-net --allow-read --allow-run --unstable test
```

## Install

```shell
export APEX_VERSION=cli_features

deno install -f --allow-read --allow-write --allow-env --allow-net --allow-run --unstable https://raw.githubusercontent.com/apexlang/apex/$APEX_VERSION/apex.ts

deno install -f --allow-read --allow-write --allow-env --allow-net --allow-run --unstable ./apex.ts
```

## Reload CLI cache

```shell
export APEX_VERSION=cli_features

deno cache --reload=https://raw.githubusercontent.com/apexlang https://raw.githubusercontent.com/apexlang/apex/$APEX_VERSION/apex.ts
```
