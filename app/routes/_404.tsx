import type { NotFoundHandler } from 'hono';

import { NotFoundPage } from '@components/pages/NotFoundPage';

const handler: NotFoundHandler = (c) => {
  c.status(404);
  return c.render(<NotFoundPage />);
};

export default handler;
