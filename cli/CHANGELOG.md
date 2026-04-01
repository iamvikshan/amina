## 1.0.0 (2026-04-01)

### ⚠ BREAKING CHANGES

* Major architectural overhaul implementing Mina's unified personality system
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
* Major architectural refactoring with TypeScript migration

- Migrate 50+ command files from JavaScript to TypeScript across all categories:
  * Economy commands (bank, beg, daily, gamble, balance, deposit, transfer, withdraw)
  * Fun commands (facts, filters, flip, generators, hack, hangman, image, love, overlay, react, tictactoe, tod, together)
  * Giveaway commands (giveaway, edit, end, list, pause, reroll, resume, start)
  * Info commands (info, leaderboard, avatar, channel, emoji, guild, user)
  * Social commands (invites, reputation)
  * Stats commands (rank, stats, statstracking, xp)
  * Suggestion commands (suggest, suggestion)
  * Utility commands (afk, paste, profile, qrcode, redflag, report, urban, weather)

- Restructure handler architecture into modular structure:
  * Create dev/ handler module with sub-handlers (main-hub, presence, minaai, tod, reload, trig-settings, listservers)
  * Create minaai/ handler module (forget-me, memories, settings, main-hub)
  * Create purge/ handler module with parameter handlers (amount-modal, amount-select, channel-select, token-modal, user-select, preview, execute)
  * Move presence handler to dev/presence/ with init, update, and handlers modules

- Add new features:
  * Implement autocomplete handler for command suggestions
  * Add dev-leaveserver command for server management
  * Enhance purge command with new interactive handler system
  * Improve Mina AI integration with dedicated handler modules

- Update core infrastructure:
  * Enhance interaction handling in interactionCreate event
  * Improve command handler with better type safety
  * Update BotClient and Command structures
  * Enhance database schemas (User schema updates)
  * Update services (aiResponder, memoryService improvements)

- Update deployment and configuration:
  * Add lavalink-entrypoint.sh script
  * Update docker-compose configurations
  * Update deployment scripts (deploy-amina-local.sh, deploy-vps.sh)
  * Update .gitignore to exclude .cursor and docs directories

This migration improves type safety, code maintainability, and sets the foundation for future enhancements.

### Features

* [phase 3.0] complete TypeScript migration of all events, entry point, and core helpers ([73e9885](https://github.com/iamvikshan/amina/commit/73e988507d8116f9724c6937b93bf676f6e0916c))
* 2-call AI extraction pipeline ([2cde254](https://github.com/iamvikshan/amina/commit/2cde25452dc4aa40560710e85430537fa1bf2d10))
* add API resilience with retry, circuit breaker, and abort ([8fdc28a](https://github.com/iamvikshan/amina/commit/8fdc28af93bc6ae7eb2fc44c6c5115f90d242855))
* add buffered AI metrics service with dashboard integration ([83e706a](https://github.com/iamvikshan/amina/commit/83e706a6f2e24200e601ff543d366c6e5cf49825))
* add conversational memory CRUD tools ([c2e3ccf](https://github.com/iamvikshan/amina/commit/c2e3ccfd871d178b42f213075bf7a4b056403f6b))
* add LRU caches, injection detection, importance decay ([c28447e](https://github.com/iamvikshan/amina/commit/c28447e6dfb2148817cf31ec8427387fc5099a3a))
* add semantic memory deduplication ([85c837e](https://github.com/iamvikshan/amina/commit/85c837e7fa9d0b1e977e9883f7d059ce4d189e66))
* add tool-call status messages with personality ([cb845f9](https://github.com/iamvikshan/amina/commit/cb845f9c1e60eb19d2a97affb3dd85ffcf699cec))
* add Vertex AI integration + multi-model router ([faf871f](https://github.com/iamvikshan/amina/commit/faf871f47b5c636d2595e5946f2d4aa2cf3a6c4f))
* add vertex validation, fix bugs, align types ([81a03ff](https://github.com/iamvikshan/amina/commit/81a03ffc9d5d6b857d7d4a4329e883c5174b1e41))
* **api:** add API server to api/ directory ([#245](https://github.com/iamvikshan/amina/issues/245)) ([e87e544](https://github.com/iamvikshan/amina/commit/e87e5445990adc26c61649bf15329a250c7e939a))
* containerize amina with docker, lavalink, and uptime kuma ([8122b55](https://github.com/iamvikshan/amina/commit/8122b5508ad706eb43800ea54472489a7863c40a))
* enhance Lavalink configuration with multiple nodes and add TODO roadmap for feature implementation ([9ad597c](https://github.com/iamvikshan/amina/commit/9ad597ccbd80019d8c34e004e5358ba4af7834eb))
* fix mina-ai DM support and complete TypeScript migration ([e30302b](https://github.com/iamvikshan/amina/commit/e30302b225892ba5bf11aa6977f507314af31f1e))
* Implement AI command registry and media extraction, and optimize AI responder initialization and data fetching. ([ee45d95](https://github.com/iamvikshan/amina/commit/ee45d95157e70c5aa3e686d39807db0831758d81))
* Implement Mina AI memory management commands and services ([036aa0e](https://github.com/iamvikshan/amina/commit/036aa0eea625c47c3297cb6b7cf4644dea3014c2))
* Initial commit. rename updatelinks.yml to links-config.yml and update GitHub URLs; add CLA Assistant workflow and update linkapp workflow ([edad69f](https://github.com/iamvikshan/amina/commit/edad69f7c152af0e341f8b4b95d632fbe1303381))
* integrate Honeybadger error tracking and fix Discord.js v15 compatibility ([0265d9f](https://github.com/iamvikshan/amina/commit/0265d9f6565824fa5f78f8b6b4a99d344bcdf046))
* migrate embedding model to gemini-embedding-001 (3072-dim) ([f2afc5e](https://github.com/iamvikshan/amina/commit/f2afc5e5ba1fa61fa620ac9149e68d86ca6dfa45))
* migrate from Google GenAI to Mistral SDK for embeddings and chat functionalities ([a427b52](https://github.com/iamvikshan/amina/commit/a427b52733627c74b14df60359bebb7f503683a6))
* migrate to @google/genai SDK from legacy @google/generative-ai ([b8a0e1a](https://github.com/iamvikshan/amina/commit/b8a0e1a3cdb009b9665cdb6a073b686b6fae534b))
* migrate to MongoDB Atlas Vector Search (drop Upstash) ([43e49ce](https://github.com/iamvikshan/amina/commit/43e49ce99cb6a2ebceecb3225edb97b80036b4f2))
* persist conversation history to MongoDB ([f8c3ac5](https://github.com/iamvikshan/amina/commit/f8c3ac5ddbe2d223216d86b5a48710ee326e7fbe))
* **reminders:** implement reminder management features including add, edit, clear, and list functionalities ([f17b027](https://github.com/iamvikshan/amina/commit/f17b0271eecc58756229697f0057cb171cea6070))
* update system prompt handling and improve prompt loading mechanism ([14488ae](https://github.com/iamvikshan/amina/commit/14488aed6115bf2578fe772ec43f856dab986081))

### Bug Fixes

* [phase 1.0.3] convert core infrastructure to TypeScript and fix interaction handling ([c153841](https://github.com/iamvikshan/amina/commit/c153841270f9ec72a7ed9663e23943d8bbb4627a))
* [phase 1.0.4] complete TypeScript migration batch - 46 files converted (94/374 total, 25.1%) ([2ced866](https://github.com/iamvikshan/amina/commit/2ced866a9c6bc47ff90c24301d05acc544566b80))
* [phase 2.0] complete handlers migration - all 19 handlers converted to TypeScript ([6b8de3f](https://github.com/iamvikshan/amina/commit/6b8de3f8425dfe65baf97890a76860b90a0aa9d8))
* [phase 4.0.1] complete admin, dev, and moderation command conversions ([8c1cea4](https://github.com/iamvikshan/amina/commit/8c1cea4fc6adc58f82f221f21ae5f8459533ec21))
* [phase1.0.1] migrate core files to TypeScript and resolve module import issues ([78d1226](https://github.com/iamvikshan/amina/commit/78d12260dcf7d035d6335aaca68ee69b13b60875))
* [phase1.0.2] add TypeScript utilities and structures for Discord bot ([ea68628](https://github.com/iamvikshan/amina/commit/ea686282b21b551513c37f936c751ab0d0f92522))
* Add Dashboard Webhook Sync for Real-Time Guild Updates ([#28](https://github.com/iamvikshan/amina/issues/28)) ([531d45a](https://github.com/iamvikshan/amina/commit/531d45ae84ac05bf713529c8af21bf6f4da719b8))
* add todRating field to User schema and implement AI command registry with permission models ([8f83550](https://github.com/iamvikshan/amina/commit/8f83550891030df79a6e84cfff0bcea8ee8fd42d))
* **api:** update api dependencies ([#257](https://github.com/iamvikshan/amina/issues/257)) ([9ab63d2](https://github.com/iamvikshan/amina/commit/9ab63d2b58aa84b2392a21fbaee684b01f9e3266))
* **api:** update api dependencies ([#273](https://github.com/iamvikshan/amina/issues/273)) ([a5b28a5](https://github.com/iamvikshan/amina/commit/a5b28a5d570adaaca71d0b7d131457a193080e93))
* **api:** update dependency hono to ^4.12.3 ([#263](https://github.com/iamvikshan/amina/issues/263)) ([5a8e19e](https://github.com/iamvikshan/amina/commit/5a8e19eebae113fe61cd03d674f50ef0ad0b3300))
* **api:** update dependency hono to ^4.12.7 ([#285](https://github.com/iamvikshan/amina/issues/285)) ([de53b18](https://github.com/iamvikshan/amina/commit/de53b18c92907b9f28a6f75299680ce7d9b974c2))
* **cli:** update CLI tool for Amina deployment and management ([7302e5d](https://github.com/iamvikshan/amina/commit/7302e5d97aa6e7c1c2dc06e0a50e91d0b1d8068b))
* decouple releases, localize R2 assets, draft API README, fix lint ([2af302f](https://github.com/iamvikshan/amina/commit/2af302f6e72573d1091a8a1475fd2fdddfec1ddd))
* **deps:** update dependency @google/genai to ^1.42.0 ([#254](https://github.com/iamvikshan/amina/issues/254)) ([064d6af](https://github.com/iamvikshan/amina/commit/064d6af852c2a7dc87174ff5db28a792548dd22f))
* **deps:** update dependency axios to ^1.13.5 ([#207](https://github.com/iamvikshan/amina/issues/207)) ([7e3575f](https://github.com/iamvikshan/amina/commit/7e3575f862f3122f6dd0108225ffe5dfc8c95f27))
* **deps:** update dependency axios to ^1.13.6 ([#264](https://github.com/iamvikshan/amina/issues/264)) ([353403e](https://github.com/iamvikshan/amina/commit/353403e8423a7b518287866c2cf4962729df0e40))
* **deps:** update dependency enhanced-ms to ^4.2.0 ([#134](https://github.com/iamvikshan/amina/issues/134)) ([6c204e0](https://github.com/iamvikshan/amina/commit/6c204e0271fd383ca0c2e9b4a77205ad37b8ed74))
* **deps:** update dependency lavalink-client to ^2.7.7 ([#104](https://github.com/iamvikshan/amina/issues/104)) ([c84e210](https://github.com/iamvikshan/amina/commit/c84e210658414e4a762dcb1b6dfa4ab96c6e3562))
* **deps:** update dependency lavalink-client to ^2.9.6 ([#265](https://github.com/iamvikshan/amina/issues/265)) ([1cc9478](https://github.com/iamvikshan/amina/commit/1cc9478f994675df009f19b609aa09550dbfcdb1))
* **deps:** update dependency lavalink-client to ^2.9.7 ([#272](https://github.com/iamvikshan/amina/issues/272)) ([2fdf612](https://github.com/iamvikshan/amina/commit/2fdf612b597b827b0026f4e7e1bd255569bf537e))
* **deps:** update dependency module-alias to ^2.3.4 ([#235](https://github.com/iamvikshan/amina/issues/235)) ([6b5a48d](https://github.com/iamvikshan/amina/commit/6b5a48d03fba2813ba862889c3bf149107592489))
* **deps:** update dependency mongoose to ^9.1.4 ([#145](https://github.com/iamvikshan/amina/issues/145)) ([2e4ec57](https://github.com/iamvikshan/amina/commit/2e4ec57a21abde9348286087fe9da3b02be0446c))
* **deps:** update dependency mongoose to ^9.2.2 ([#261](https://github.com/iamvikshan/amina/issues/261)) ([ec25c59](https://github.com/iamvikshan/amina/commit/ec25c5989225622560a947c55d990bd0bd225947))
* **deps:** update dependency mongoose to ^9.2.3 ([#266](https://github.com/iamvikshan/amina/issues/266)) ([a8afdf5](https://github.com/iamvikshan/amina/commit/a8afdf5b3bafd1c162047f6ac2efa80273efa476))
* **dev,database:** resolve interaction handling bugs and implement guild cleanup ([0e8522d](https://github.com/iamvikshan/amina/commit/0e8522d0f87bc314fb62ee359b1d0f2564f4b52a))
* Enhance bot functionality with improved permission checks and new component structures ([c3bd443](https://github.com/iamvikshan/amina/commit/c3bd4431dfd2079c0d4a15a0b96904984e2163bd))
* enhance command registration, loading, and reliability ([fdaf26d](https://github.com/iamvikshan/amina/commit/fdaf26d81db4802de190355cfd9f01e4e35436d7))
* forget-me embed dead branch and registry schema collision ([4ecd77e](https://github.com/iamvikshan/amina/commit/4ecd77e13af2a217b319e022c9600df748c82cd9))
* release isolation, signing keys, memory guards, tool UX ordering ([a1bed49](https://github.com/iamvikshan/amina/commit/a1bed49b7a99c1a73c0c5abe86a33963583c1069))
* replace deprecated embedding-001 with configurable models ([98b856a](https://github.com/iamvikshan/amina/commit/98b856a67099a1c4c95c9908ba7ce5eb5250d04b))
* resolve 8 critical bugs ([7e7077d](https://github.com/iamvikshan/amina/commit/7e7077d7082828e7346ab3229d230fcef66dc99c))
* resolve Docker container module resolution issues ([fff0d46](https://github.com/iamvikshan/amina/commit/fff0d46ba1e629433df089b8263a28f2cddb9df8))
* Update project configuration and clean up code ([d9543e1](https://github.com/iamvikshan/amina/commit/d9543e114e3d2d2d068ff8bb18348bac3b08581c))
* validate channel type in ticket user management to prevent runtime errors ([c886311](https://github.com/iamvikshan/amina/commit/c88631158bcb8223c3dbdefe62e0125af6c71463))

### Code Refactoring

* complete Mina personality system migration ([6ce1aa7](https://github.com/iamvikshan/amina/commit/6ce1aa73ac286cf57b72b4f56f11c82dee82aa35))
* migrate commands to TypeScript and restructure handler architecture ([bbd77fd](https://github.com/iamvikshan/amina/commit/bbd77fd41469fa4c6e2328177ea7b95a3fc2089a))
