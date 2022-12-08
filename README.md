# Apex CLI

Apex is an interface definition language (IDL) for modeling software. Generate source code, documentation, integration, everything automatically.

### Goals:

- <ins>A</ins>pproachable - Apex was designed from the ground up to be succinct. Interfaces and data types are described using familiar syntax that won't slow you down.
- <ins>P</ins>rotocol agnostic - Regardless of the architecture, your data and interfaces are fundamentally the same. Use Apex to generate code for any serialization format or protocol.
- <ins>Ex</ins>tensible - Generators are written in TypeScript. Easily add custom generators that satisfy your unique needs and publish them for everyone to use.

For more information, visit [https://apexlang.io](https://apexlang.io).

## Installation

First, install [Deno](https://github.com/denoland/deno_install).

Then run the command below from a terminal.

```
deno install -A -f -n apex https://deno.land/x/apex_cli@latest/apex.ts
```

```shell
apex --help
```

Output:

```
  Usage:   apex
  Version: 0.0.2

  Description:

    A code generation tool using Apex, an interface definition language (IDL) for modeling software.

  Options:

    -h, --help  - Show this help.

  Commands:

    new          <template> <dir>    - Create a new project directory using a template.
    init         <template>          - Initialize a project using a template.
    generate     [configuration...]  - Run apex generators from a given configuration.
    list                             - List available resources.
    watch        [configuration...]  - Watch apex configuration for changes and trigger code generation.
    upgrade                          - Upgrade apex executable to latest or given version.
    help         [command]           - Show this help or the help of a sub-command.
    completions                      - Generate shell completions.
```

## Contributing

Please read [CONTRIBUTING.md](https://github.com/apexlang/apex/blob/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/apexlang/apex/tags).

## License

This project is licensed under the [Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/) - see the [LICENSE](LICENSE) file for details
