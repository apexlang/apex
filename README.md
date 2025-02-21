# Apexlang CLI

The `apex` CLI is a one-stop shop for all projects across all languages.

It's a

- Project templating and scaffolding tool
- Extensible code generation tool
- Task runner

For more information, visit [https://apexlang.io](https://apexlang.io).

## Prerequisites

The `apex` CLI depends on Deno.

Install `deno` with instructions
[here](https://github.com/denoland/deno_install).

## Installation

To install a release version of the `apex` CLI, run the command below:

```
deno install -g -A --unstable-worker-options -f -n apex jsr:@apexlang/apex
```

To install from source, clone this repository and run `./apex install`

```sh
git clone https://github.com/apexlang/apex.git
cd apex
deno install -g -A --config deno.json --unstable-worker-options -f ./mod.ts
```

## Usage

Visit [https://apexlang.io](https://apexlang.io) for official documentation and
usage.

```shell
apex --help
```

Output:

```console{title="apex help"}
ERROR Error: couldn't fetch the latest version - try again after sometime
    at JsrProvider.getVersions (https://jsr.io/@cliffy/command/1.0.0-rc.7/upgrade/provider/jsr.ts:48:13)
    at eventLoopTick (ext:core/01_core.js:177:7)
    at async UpgradeCommand.getLatestVersion (https://jsr.io/@cliffy/command/1.0.0-rc.7/upgrade/upgrade_command.ts:173:24)
    at async checkVersion (https://jsr.io/@cliffy/command/1.0.0-rc.7/upgrade/_check_version.ts:13:25)
    at async HelpCommand.actionHandler (https://jsr.io/@cliffy/command/1.0.0-rc.7/help/help_command.ts:30:9)
    at async HelpCommand.execute (https://jsr.io/@cliffy/command/1.0.0-rc.7/command.ts:1940:7)
    at async HelpCommand.parseCommand (https://jsr.io/@cliffy/command/1.0.0-rc.7/command.ts:1772:14)
    at async file:///home/runner/work/apex/apex/mod.ts:85:5
```

## Running tests

To run tests, run the command below:

```sh
apex test
```

## Development

To run the development version of the `apex` CLI, use the `apex` script in the
root of this repository, e.g.

```sh
./apex help
```

## Contributing

Please read
[CONTRIBUTING.md](https://github.com/apexlang/apex/blob/main/CONTRIBUTING.md)
for details on our code of conduct, and the process for submitting pull requests
to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available,
see the [tags on this repository](https://github.com/apexlang/apex/tags).

## License

This project is licensed under the
[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/) - see the
[LICENSE](LICENSE) file for details
