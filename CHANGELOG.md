# [v1.2.1](https://github.com/iamvikshan/amina/compare/v1.2.0...v1.2.1) (2025-11-12)



## [1.2.1](https://github.com/iamvikshan/amina/compare/v1.2.0...v1.2.1) (2025-11-12)

### Bug Fixes

* [phase 4.0.1] complete admin, dev, and moderation command conversions ([8c1cea4](https://github.com/iamvikshan/amina/commit/8c1cea4fc6adc58f82f221f21ae5f8459533ec21))

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
