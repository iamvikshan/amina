// Minimal Bun runtime typings for this codebase.
// We intentionally keep this small to avoid pulling in broader DOM/React types.

declare global {
  // Bun global (available at runtime when running under Bun)
  // https://bun.sh/docs/api/bun-file
  // eslint-disable-next-line no-var
  var Bun: {
    file(path: string): {
      exists(): Promise<boolean>;
    } & Blob;
  };
}

export {};
