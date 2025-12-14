import { jsxRenderer } from 'hono/jsx-renderer';

// BaseLayout renders the full document shell (<html>, <head>, <body>).
// Keep the renderer minimal to avoid nesting <html> tags.
export default jsxRenderer(({ children }) => <>{children}</>);
