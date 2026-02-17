import { Hono } from 'hono';
import { success } from '../../lib/response';
import { publicRateLimit } from '../../middleware/rateLimit';

// Import route modules
import images from './images';
import filters from './filters';
import overlays from './overlays';
import generators from './generators';
import bots from './bots';
import user from './user';

const v1 = new Hono<{ Bindings: Env }>();

// API info endpoint (no auth required)
v1.get('/', (c) => {
  return success(c, {
    version: 'v1',
    documentation: 'https://api.apidocs.4mina.app',
    endpoints: {
      images: {
        'rank-card': 'GET /v1/images/rank-card',
        'welcome-card': 'GET /v1/images/welcome-card',
        'farewell-card': 'GET /v1/images/farewell-card',
        'spotify-card': 'GET /v1/images/spotify-card',
        color: 'GET /v1/images/color',
        circle: 'GET /v1/images/circle',
      },
      bots: {
        list: 'GET /v1/bots',
        info: 'GET /v1/bots/:clientId',
        stats: 'GET /v1/bots/:clientId/stats',
        commands: 'GET /v1/bots/:clientId/commands',
        status: 'GET /v1/bots/:clientId/status',
      },
      user: {
        'header-data': 'GET /v1/user/header-data',
        profile: 'GET /v1/user/profile',
        guilds: 'GET /v1/user/guilds',
        achievements: 'GET /v1/user/achievements',
      },
      filters: {
        greyscale: 'GET /v1/images/filters/greyscale',
        blur: 'GET /v1/images/filters/blur',
        sepia: 'GET /v1/images/filters/sepia',
        invert: 'GET /v1/images/filters/invert',
        brighten: 'GET /v1/images/filters/brighten',
        darken: 'GET /v1/images/filters/darken',
        contrast: 'GET /v1/images/filters/contrast',
        saturate: 'GET /v1/images/filters/saturate',
        'hue-rotate': 'GET /v1/images/filters/hue-rotate',
        pixelate: 'GET /v1/images/filters/pixelate',
      },
      overlays: {
        approved: 'GET /v1/images/overlays/approved',
        rejected: 'GET /v1/images/overlays/rejected',
        wasted: 'GET /v1/images/overlays/wasted',
        triggered: 'GET /v1/images/overlays/triggered',
        gay: 'GET /v1/images/overlays/gay',
        jail: 'GET /v1/images/overlays/jail',
        rip: 'GET /v1/images/overlays/rip',
      },
      generators: {
        affect: 'GET /v1/images/generators/affect',
        beautiful: 'GET /v1/images/generators/beautiful',
        changemymind: 'GET /v1/images/generators/changemymind',
        delete: 'GET /v1/images/generators/delete',
        trash: 'GET /v1/images/generators/trash',
        drake: 'GET /v1/images/generators/drake',
        distracted: 'GET /v1/images/generators/distracted',
        facts: 'GET /v1/images/generators/facts',
      },
    },
    authentication: {
      type: 'Bearer',
      header: 'Authorization: Bearer <api_key>',
      getKey: 'https://4mina.app/dash/user',
    },
    rateLimit: {
      requests: 60,
      window: '1 minute',
      headers: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
    },
  });
});

// Bot routes - public, rate-limited
v1.use('/bots/*', publicRateLimit);
v1.route('/bots', bots);

// User routes - requires authentication
v1.route('/user', user);

// Mount route modules
v1.route('/images', images);
v1.route('/images/filters', filters);
v1.route('/images/overlays', overlays);
v1.route('/images/generators', generators);

export default v1;
