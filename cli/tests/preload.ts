// Preload all source modules to avoid Bun parallel test module resolution race
import '../src/env'
import '../src/health'
import '../src/shared'
