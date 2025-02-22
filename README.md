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
Usage:   apex                                                                                         
Version: 0.2.0  

Description:

  A complete project tool suite based on Apexlang, an interface definition language (IDL) for modeling software.

Options:

  -h, --help     - Show this help.                            
  -V, --version  - Show the version number for this program.  

Commands:

  install      <location>          - Install templates locally.                                  
  new          <template> <dir>    - Create a new project directory using a template.            
  init         <template>          - Initialize a project using a template.                      
  generate     [configuration...]  - Run Apexlang generators from a given configuration.         
  list                             - List available resources.                                   
  describe                         - Describe available resources.                               
  watch        [configuration...]  - Watch configuration for changes and trigger code generation.
  run          [tasks...]          - Run tasks.                                                  
  upgrade                          - Upgrade apex executable to latest or given version.         
  help         [command]           - Show this help or the help of a sub-command.                
  completions                      - Generate shell completions.
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
