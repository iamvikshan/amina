export default {
  branches: ['main'],
  tagFormat: 'cli-v${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: false },
          { type: 'fix', release: false },
          { type: 'perf', release: false },
          { type: 'revert', release: false },
          { breaking: true, release: false },
          { scope: 'cli', type: 'feat', release: 'minor' },
          { scope: 'cli', type: 'fix', release: 'patch' },
          { scope: 'cli', type: 'perf', release: 'patch' },
          { scope: 'cli', type: 'revert', release: 'patch' },
          { scope: 'cli', breaking: true, release: 'major' },
        ],
      },
    ],

    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        writerOpts: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'revert', section: 'Reverts' },
          ],
        },
      },
    ],

    ['@semantic-release/changelog', { changelogFile: 'cli/CHANGELOG.md' }],

    ['@semantic-release/npm', { pkgRoot: 'cli' }],

    [
      '@semantic-release/git',
      {
        assets: ['cli/package.json', 'cli/CHANGELOG.md'],
        message:
          'chore(cli-release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
}
