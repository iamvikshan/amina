import { createRoute } from 'honox/factory';

export const GET = createRoute(async () => {
  const filePath = './public/favicon.ico';

  // Dev server runs under Node (Vite), production server runs under Bun.
  // Avoid referencing `Bun` unless it exists.
  const bun = (globalThis as any).Bun as
    | undefined
    | { file: (path: string) => { exists: () => Promise<boolean> } };

  if (bun) {
    const file = bun.file(filePath) as any;
    if (!(await file.exists())) {
      return new Response('Not Found', { status: 404 });
    }
    return new Response(file, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const { readFile, access } = await import('node:fs/promises');
  try {
    await access(filePath);
  } catch {
    return new Response('Not Found', { status: 404 });
  }

  const buffer = await readFile(filePath);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
