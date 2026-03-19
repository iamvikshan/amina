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

```bash
bunx amina install
# or
npx amina install
```

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

- **Node.js >= 22** or **Bun >= 1.3.11**
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
