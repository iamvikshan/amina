```
    _    __  __ ___ _   _    _
   / \  |  \/  |_ _| \ | |  / \
  / _ \ | |\/| || ||  \| | / _ \
 / ___ \| |  | || || |\  |/ ___ \
/_/   \_\_|  |_|___|_| \_/_/   \_\
```

# Amina -- Discord Bot Deployment CLI

Deploy, update, and manage [Amina](https://github.com/iamvikshan/amina)
Discord bot instances from your terminal.

## Quick Start

### Standalone binary (Linux/macOS, no Bun or Node runtime on the host)

```bash
curl -fsSL https://raw.githubusercontent.com/iamvikshan/amina/main/scripts/install-cli.sh | sh
amina install
```

The installer resolves the latest `cli-v*` GitHub release, downloads the
matching `amina-<os>-<arch>` binary, and installs it to `/usr/local/bin/amina`
when writable or `~/.local/bin/amina` otherwise.

Windows users should download `amina-windows-x64.exe` from the latest
`cli-v*` release on GitHub and place it somewhere on `PATH`.

### Published JS artifact (launcher-specific runtime requirements)

```bash
bunx amina install
# or
npx amina install
```

- `bunx amina install` requires **Bun >= 1.3.11** on `PATH`.
- `npx amina install` requires **Node.js + npm** to launch the package and
  **Bun >= 1.3.11** on `PATH` to execute the published CLI's Bun shebang.
- Use the standalone binary path above if you want a host install with no Bun
  or Node runtime requirement.

Follow the interactive prompts to configure and deploy your instance.

## Commands

| Command     | Description                   |
| ----------- | ----------------------------- |
| `check`     | Check for new Amina releases  |
| `install`   | Deploy a fresh Amina instance |
| `update`    | Update an existing deployment |
| `uninstall` | Remove an Amina deployment    |
| `status`    | Show deployment status        |
| `help`      | Show help message             |

## Options

| Flag        | Alias   | Description                           |
| ----------- | ------- | ------------------------------------- |
| `--dry-run` |         | Preview changes without executing     |
| `--force`   | `-f -y` | Skip confirmations (auto-approve)     |
| `--mode`    |         | Set mode: `deploy` (default) or `dev` |

## Modes

- **deploy** -- Production deployment via Docker Compose. Pulls the latest
  image, configures environment variables, and starts the bot container.
- **dev** -- Development mode. Clones the repository and runs the bot directly
  with Bun for local development and testing.

## Requirements

- **Bun >= 1.3.11** on `PATH` when using the published JS artifact
- **Node.js + npm** as well when launching that published artifact with `npx`
  or a global npm install
- **Linux/macOS x64 or arm64** for the standalone binary installer, or **Windows x64** for the manual `.exe` asset
- **Docker** + **Docker Compose** (for deploy mode)
- **git** (for dev mode)

## Examples

```bash
# Deploy with Docker (production)
amina install --mode deploy

# Set up a local dev environment
amina install --mode dev

# Preview an update without applying
amina update --dry-run

# Force update, skip confirmations
amina update --force

# Check current deployment status
amina status
```

## Links

- **GitHub:** <https://github.com/iamvikshan/amina>
- **Issues:** <https://github.com/iamvikshan/amina/issues/new/choose>
- **npm:** <https://www.npmjs.com/package/amina>

## License

[CC-BY-4.0](https://github.com/iamvikshan/amina/blob/main/LICENSE.md)
