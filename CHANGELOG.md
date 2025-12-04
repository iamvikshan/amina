# [v3.0.0](https://github.com/iamvikshan/amina/compare/v2.2.1...v3.0.0) (2025-12-03)

## [3.0.0](https://github.com/iamvikshan/amina/compare/v2.2.1...v3.0.0) (2025-12-03)

### ⚠ BREAKING CHANGES

- Major architectural overhaul implementing Mina's unified personality system
  This release introduces a comprehensive UI/UX standardization across the entire codebase,
  establishing consistent patterns for embeds, buttons, and response strings.

### ✨ New Systems

**MinaEmbed Factory (`src/structures/embeds/MinaEmbed.ts`)**

- Centralized embed creation with preset color themes (primary, secondary, warning, error, success, gold)
- Context-aware embed builders for users, members, guilds, moderation, economy, music, and levels
- Random quote/tip injection system for personality consistency
- Extends EmbedBuilder with Mina-specific styling

**MinaButtons/MinaRows System (`src/helpers/componentHelper.ts`)**

- Semantic button factory: yeah(), nah(), back(), nuke(), link(), nav()
- Pre-built row patterns: yesNoRow(), backRow(), confirmCancelRow()
- Consistent lowercase labels matching Mina's casual voice
- 315+ instances across the codebase

**Mina Response Helper (`src/helpers/mina.ts`)**

- Centralized response strings via mina.say() and mina.sayf()
- Template support with variable interpolation
- Response pools with random selection for variety
- Unified color constants and moderation colors

**Response Data Files**

- src/data/responses.json - 1600+ response strings organized by category
- src/data/respFun.json - Fun command responses
- src/data/respMod.json - Moderation responses

### Code Refactoring

- complete Mina personality system migration ([6ce1aa7](https://github.com/iamvikshan/amina/commit/6ce1aa73ac286cf57b72b4f56f11c82dee82aa35))

# [v2.2.1](https://github.com/iamvikshan/amina/compare/v2.2.0...v2.2.1) (2025-11-29)

## [2.2.1](https://github.com/iamvikshan/amina/compare/v2.2.0...v2.2.1) (2025-11-29)

### Bug Fixes

- add todRating field to User schema and implement AI command registry with permission models ([8f83550](https://github.com/iamvikshan/amina/commit/8f83550891030df79a6e84cfff0bcea8ee8fd42d))

# [v2.2.0](https://github.com/iamvikshan/amina/compare/v2.1.3...v2.2.0) (2025-11-22)

## [2.2.0](https://github.com/iamvikshan/amina/compare/v2.1.3...v2.2.0) (2025-11-22)

### Features

- Implement AI command registry and media extraction, and optimize AI responder initialization and data fetching. ([ee45d95](https://github.com/iamvikshan/amina/commit/ee45d95157e70c5aa3e686d39807db0831758d81))

# [v2.1.3](https://github.com/iamvikshan/amina/compare/v2.1.2...v2.1.3) (2025-11-21)

## 🐛 Bug Fixes

- [`22610db`](https://github.com/iamvikshan/amina/commit/22610db) fix: resolve type system issues, config refactoring, and improve code reliability

## [2.1.3](https://github.com/iamvikshan/amina/compare/v2.1.2...v2.1.3) (2025-11-21)

# [v2.1.2](https://github.com/iamvikshan/amina/compare/v2.1.1...v2.1.2) (2025-11-19)

## [2.1.2](https://github.com/iamvikshan/amina/compare/v2.1.1...v2.1.2) (2025-11-19)

### Bug Fixes

- enhance command registration, loading, and reliability ([fdaf26d](https://github.com/iamvikshan/amina/commit/fdaf26d81db4802de190355cfd9f01e4e35436d7))

# [v2.1.1](https://github.com/iamvikshan/amina/compare/v2.1.0...v2.1.1) (2025-11-18)

## [2.1.1](https://github.com/iamvikshan/amina/compare/v2.1.0...v2.1.1) (2025-11-18)

### Bug Fixes

- **dev,database:** resolve interaction handling bugs and implement guild cleanup ([0e8522d](https://github.com/iamvikshan/amina/commit/0e8522d0f87bc314fb62ee359b1d0f2564f4b52a))

# [v2.1.0](https://github.com/iamvikshan/amina/compare/v2.0.0...v2.1.0) (2025-11-18)

## [2.1.0](https://github.com/iamvikshan/amina/compare/v2.0.0...v2.1.0) (2025-11-18)

### Features

- fix mina-ai DM support and complete TypeScript migration ([e30302b](https://github.com/iamvikshan/amina/commit/e30302b225892ba5bf11aa6977f507314af31f1e))

# [v2.0.0](https://github.com/iamvikshan/amina/compare/v1.3.1...v2.0.0) (2025-11-17)

## [2.0.0](https://github.com/iamvikshan/amina/compare/v1.3.1...v2.0.0) (2025-11-17)

### ⚠ BREAKING CHANGES

- Major architectural refactoring with TypeScript migration

* Migrate 50+ command files from JavaScript to TypeScript across all categories:
  - Economy commands (bank, beg, daily, gamble, balance, deposit, transfer, withdraw)
  - Fun commands (facts, filters, flip, generators, hack, hangman, image, love, overlay, react, tictactoe, tod, together)
  - Giveaway commands (giveaway, edit, end, list, pause, reroll, resume, start)
  - Info commands (info, leaderboard, avatar, channel, emoji, guild, user)
  - Social commands (invites, reputation)
  - Stats commands (rank, stats, statstracking, xp)
  - Suggestion commands (suggest, suggestion)
  - Utility commands (afk, paste, profile, qrcode, redflag, report, urban, weather)

* Restructure handler architecture into modular structure:
  - Create dev/ handler module with sub-handlers (main-hub, presence, minaai, tod, reload, trig-settings, listservers)
  - Create minaai/ handler module (forget-me, memories, settings, main-hub)
  - Create purge/ handler module with parameter handlers (amount-modal, amount-select, channel-select, token-modal, user-select, preview, execute)
  - Move presence handler to dev/presence/ with init, update, and handlers modules

* Add new features:
  - Implement autocomplete handler for command suggestions
  - Add dev-leaveserver command for server management
  - Enhance purge command with new interactive handler system
  - Improve Mina AI integration with dedicated handler modules

* Update core infrastructure:
  - Enhance interaction handling in interactionCreate event
  - Improve command handler with better type safety
  - Update BotClient and Command structures
  - Enhance database schemas (User schema updates)
  - Update services (aiResponder, memoryService improvements)

* Update deployment and configuration:
  - Add lavalink-entrypoint.sh script
  - Update docker-compose configurations
  - Update deployment scripts (deploy-amina-local.sh, deploy-vps.sh)
  - Update .gitignore to exclude .cursor and docs directories

This migration improves type safety, code maintainability, and sets the foundation for future enhancements.

### Code Refactoring

- migrate commands to TypeScript and restructure handler architecture ([bbd77fd](https://github.com/iamvikshan/amina/commit/bbd77fd41469fa4c6e2328177ea7b95a3fc2089a))

# [v1.3.1](https://github.com/iamvikshan/amina/compare/v1.3.0...v1.3.1) (2025-11-17)

## [1.3.1](https://github.com/iamvikshan/amina/compare/v1.3.0...v1.3.1) (2025-11-17)

### Bug Fixes

- Update project configuration and clean up code ([d9543e1](https://github.com/iamvikshan/amina/commit/d9543e114e3d2d2d068ff8bb18348bac3b08581c))

# [v1.3.0](https://github.com/iamvikshan/amina/compare/v1.2.1...v1.3.0) (2025-11-16)

## [1.3.0](https://github.com/iamvikshan/amina/compare/v1.2.1...v1.3.0) (2025-11-16)

### Features

- Implement Mina AI memory management commands and services ([036aa0e](https://github.com/iamvikshan/amina/commit/036aa0eea625c47c3297cb6b7cf4644dea3014c2))

# [v1.2.1](https://github.com/iamvikshan/amina/compare/v1.2.0...v1.2.1) (2025-11-12)

## [1.2.1](https://github.com/iamvikshan/amina/compare/v1.2.0...v1.2.1) (2025-11-12)

### Bug Fixes

- [phase 4.0.1] complete admin, dev, and moderation command conversions ([8c1cea4](https://github.com/iamvikshan/amina/commit/8c1cea4fc6adc58f82f221f21ae5f8459533ec21))

# [v1.2.0](https://github.com/iamvikshan/amina/compare/v1.1.7...v1.2.0) (2025-11-10)

## [1.2.0](https://github.com/iamvikshan/amina/compare/v1.1.7...v1.2.0) (2025-11-10)

### Features

- [phase 3.0] complete TypeScript migration of all events, entry point, and core helpers ([73e9885](https://github.com/iamvikshan/amina/commit/73e988507d8116f9724c6937b93bf676f6e0916c))

# [v1.1.7](https://github.com/iamvikshan/amina/compare/v1.1.6...v1.1.7) (2025-11-09)

## [1.1.7](https://github.com/iamvikshan/amina/compare/v1.1.6...v1.1.7) (2025-11-09)

### Bug Fixes

- [phase 2.0] complete handlers migration - all 19 handlers converted to TypeScript ([6b8de3f](https://github.com/iamvikshan/amina/commit/6b8de3f8425dfe65baf97890a76860b90a0aa9d8))

# [v1.1.6](https://github.com/iamvikshan/amina/compare/v1.1.5...v1.1.6) (2025-11-08)

## [1.1.6](https://github.com/iamvikshan/amina/compare/v1.1.5...v1.1.6) (2025-11-08)

### Bug Fixes

- resolve Docker container module resolution issues ([fff0d46](https://github.com/iamvikshan/amina/commit/fff0d46ba1e629433df089b8263a28f2cddb9df8))

# [v1.1.5](https://github.com/iamvikshan/amina/compare/v1.1.4...v1.1.5) (2025-11-04)

## [1.1.5](https://github.com/iamvikshan/amina/compare/v1.1.4...v1.1.5) (2025-11-04)

### Bug Fixes

- Add Dashboard Webhook Sync for Real-Time Guild Updates ([#28](https://github.com/iamvikshan/amina/issues/28)) ([531d45a](https://github.com/iamvikshan/amina/commit/531d45ae84ac05bf713529c8af21bf6f4da719b8))

# [v1.1.4](https://github.com/iamvikshan/amina/compare/v1.1.3...v1.1.4) (2025-11-02)

## [1.1.4](https://github.com/iamvikshan/amina/compare/v1.1.3...v1.1.4) (2025-11-02)

### Bug Fixes

- [phase 1.0.4] complete TypeScript migration batch - 46 files converted (94/374 total, 25.1%) ([2ced866](https://github.com/iamvikshan/amina/commit/2ced866a9c6bc47ff90c24301d05acc544566b80))

# [v1.1.3](https://github.com/iamvikshan/amina/compare/v1.1.2...v1.1.3) (2025-10-31)

## [1.1.3](https://github.com/iamvikshan/amina/compare/v1.1.2...v1.1.3) (2025-10-31)

### Bug Fixes

- [phase 1.0.3] convert core infrastructure to TypeScript and fix interaction handling ([c153841](https://github.com/iamvikshan/amina/commit/c153841270f9ec72a7ed9663e23943d8bbb4627a))

# [v1.1.2](https://github.com/iamvikshan/amina/compare/v1.1.1...v1.1.2) (2025-10-30)

## [1.1.2](https://github.com/iamvikshan/amina/compare/v1.1.1...v1.1.2) (2025-10-30)

### Bug Fixes

- [phase1.0.2] add TypeScript utilities and structures for Discord bot
  ([ea68628](https://github.com/iamvikshan/amina/commit/ea686282b21b551513c37f936c751ab0d0f92522))

# [v1.1.1](https://github.com/iamvikshan/amina/compare/v1.1.0...v1.1.1) (2025-10-30)

## [1.1.1](https://github.com/iamvikshan/amina/compare/v1.1.0...v1.1.1) (2025-10-30)

### Bug Fixes

- [phase1.0.1] migrate core files to TypeScript and resolve module import issues
  ([78d1226](https://github.com/iamvikshan/amina/commit/78d12260dcf7d035d6335aaca68ee69b13b60875))

# [v1.1.0](https://github.com/iamvikshan/amina/compare/v1.0.0...v1.1.0) (2025-10-30)

## [1.1.0](https://github.com/iamvikshan/amina/compare/v1.0.0...v1.1.0) (2025-10-30)

### Features

- containerize amina with docker, lavalink, and uptime kuma
  ([8122b55](https://github.com/iamvikshan/amina/commit/8122b5508ad706eb43800ea54472489a7863c40a))
- enhance Lavalink configuration with multiple nodes and add TODO roadmap for
  feature implementation
  ([9ad597c](https://github.com/iamvikshan/amina/commit/9ad597ccbd80019d8c34e004e5358ba4af7834eb))
- integrate Honeybadger error tracking and fix Discord.js v15 compatibility
  ([0265d9f](https://github.com/iamvikshan/amina/commit/0265d9f6565824fa5f78f8b6b4a99d344bcdf046))

# v1.0.0 (2024-12-11)

## 1.0.0 (2024-12-11)

### Features

- Initial commit. rename updatelinks.yml to links-config.yml and update GitHub
  URLs; add CLA Assistant workflow and update linkapp workflow
  ([edad69f](https://github.com/iamvikshan/amina/commit/edad69f7c152af0e341f8b4b95d632fbe1303381))

* Better onboarding for new guilds.
* Added `/dev onboarding` command for triggering the settingsing for one or all
  guilds.
* Added `./src/commands/dev/dev.js` for ALL developer commands.
* Amina now responds in a more anime-like way to commands.
* Deleted codecov workflow
* added `./static-analysis.datadog.yml` for datadog static analysis
* `/bot changelog` command now pulls the bot's mini-changelog for the latest 3
  releases.
* Moved github configs to .env
* Updated dependencies.
* Lavalink configs are now in the env for security and easy updates.
* Renamed `./src/commands/developer` to `./src/commands/dev` and
  `./src/commands/information` to `./src/commands/info`
* Added sponsors workflow for GitHub sponsors
* Updated dependencies
* Add Voice channels support
* fix: upgrade mongoose from 7.3.4 to 8.0.0
* Fix contexts count always 0
* Renamed `./src/commands/moderation/shared` to
  `./src/commands/moderation/message`
* Amina now runs on Heroku
* Stats and invites will be tracked by default
* removed `npm run format` from the `npm run update` script to eliminate the
  possibility of formatting an already formatted code resulting in git errors
* excluded `docs` folder from `npm run format` script to prevent formatting the
  documentation files, which breaks links in gitbook.
* Bot is now Amina
* Amina now has ToD
* Amina now has a changelog command
* Amina now can purge up to 500 messages
* 🗑️ Unnecessary commands removed

## Fixes & Improvements

- Fixed `require` to a `dynamic import` in `./src/commands/bot/bot.js` to fix
  the `/changelog` command not working.
- Fixed OWNER/DEV permissions not working.
- Fixed `/bot changelog` command not working.
- Fixed music module not working.
- Fixed Cannot read properties of undefined (reading 'find')
- Fix "Unknown Interaction" error when start a giveaway
- Fix help subcommands not loading
- fix music search bug
- Fix `move` command
- fixed rank card
- fix duplicate ranks
- fix invite ranks
- Fixed `leaderboard` command in which servers whose leaderboard is not set
  would send error instead of explaining it
- Fixed rank card username
- Fixed greeting fields can't be deleted in dashboard
- Fixed greeting fields not updating in dashboard
- Fixed anti-massmention
- Fixed null is not snowflake error
- Fixed command usage
- Fixed replit issues
- Fixed suggestion null
- Fixed Broken API links
