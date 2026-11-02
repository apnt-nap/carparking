import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { WebSocketServer } from 'ws';
import { hashPlate, isValidPlate, isValidProvince } from './plates.js';
import { ERROR_STATUS, ProviderError, type ParkingProvider } from './provider.js';
import type { Lang, Origin } from './types.js';

type Query = Record<string, string | undefined>;

/** Returns undefined when no location was sent, null when it was sent but invalid. */
function parseOrigin(q: Query): Origin | undefined | null {
  if (q.lat === undefined && q.lng === undefined) return undefined;
  const lat = Number(q.lat);
  const lng = Number(q.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// shortcut: the prototype trusts an x-user-id header instead of real accounts; add auth before any real plates.
function userId(req: FastifyRequest, reply: FastifyReply): string | undefined {
  const id = req.headers['x-user-id'];
  if (typeof id === 'string' && /^[\w-]{1,64}$/.test(id)) return id;
  reply.code(401).send({ error: 'x-user-id header required' });
  return undefined;
}

/** HTTP and WebSocket API from SYSTEM_REQUIREMENTS.md §6. */
export function buildServer(provider: ParkingProvider, opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  // Expected business errors (wrong password, low balance…) become 4xx with a code the app can translate.
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ProviderError) return reply.code(ERROR_STATUS[err.code]).send({ error: err.code });
    return reply.send(err);
  });

  app.get('/malls', async (req, reply) => {
    const origin = parseOrigin(req.query as Query);
    if (origin === null) return reply.code(400).send({ error: 'lat and lng must be valid numbers' });
    return provider.listMalls(origin);
  });

  app.get('/malls/:id', async (req, reply) => {
    const { sort } = req.query as Query;
    const mall = await provider.getMall((req.params as { id: string }).id, sort === 'order' ? 'order' : 'free');
    return mall ?? reply.code(404).send({ error: 'mall not found' });
  });

  app.get('/floors/:id', async (req, reply) => {
    const floor = await provider.getFloor((req.params as { id: string }).id);
    return floor ?? reply.code(404).send({ error: 'floor not found' });
  });

  app.get('/search', async (req, reply) => {
    const q = req.query as Query;
    const origin = parseOrigin(q);
    if (origin === null) return reply.code(400).send({ error: 'lat and lng must be valid numbers' });
    const lang: Lang = q.lang === 'en' ? 'en' : 'th';
    return provider.search((q.q ?? '').slice(0, 100), lang, origin);
  });

  // Phase 2 (FR-21): plate registration needs explicit PDPA consent.
  app.post('/plates', async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return reply;
    const body = (req.body ?? {}) as { number?: unknown; province?: unknown; consent?: unknown; car_model?: unknown; car_color?: unknown };
    if (body.consent !== true) return reply.code(400).send({ error: 'PDPA consent is required' });
    if (typeof body.number !== 'string' || !isValidPlate(body.number)) {
      return reply.code(400).send({ error: 'plate number must look like "1กก 1234" or "กข 123"' });
    }
    if (typeof body.province !== 'string' || !isValidProvince(body.province)) {
      return reply.code(400).send({ error: 'province must be written in Thai' });
    }
    const car = {
      car_model: typeof body.car_model === 'string' ? body.car_model : undefined,
      car_color: typeof body.car_color === 'string' ? body.car_color : undefined,
    };
    const plate = await provider.registerPlate(uid, body.number, body.province, car);
    req.log.info({ plate: hashPlate(plate.number, plate.province) }, 'plate registered');
    return reply.code(201).send(plate);
  });

  app.get('/plates', async (req, reply) => {
    const uid = userId(req, reply);
    return uid ? provider.listPlates(uid) : reply;
  });

  app.delete('/plates/:id', async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return reply;
    const ok = await provider.deletePlate(uid, (req.params as { id: string }).id);
    return ok ? reply.code(204).send() : reply.code(404).send({ error: 'plate not found' });
  });

  // FR-25: simulated LPR gate.
  app.post('/sim/gate', async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (typeof b.mall_id !== 'string' || typeof b.plate_number !== 'string' || typeof b.province !== 'string'
      || (b.direction !== 'entry' && b.direction !== 'exit')) {
      return reply.code(400).send({ error: 'mall_id, plate_number, province and direction (entry|exit) are required' });
    }
    const result = await provider.gateEvent({
      mall_id: b.mall_id, plate_number: b.plate_number, province: b.province, direction: b.direction,
      validated: b.validated === true,
    });
    req.log.info({ plate: hashPlate(b.plate_number, b.province), direction: b.direction, action: result.action }, 'gate event');
    return result;
  });

  app.get('/tickets', async (req, reply) => {
    const uid = userId(req, reply);
    return uid ? provider.listTickets(uid) : reply;
  });

  // Layout v2 (UPDATE_LAYOUT_V2.md A5). Demo accounts: the app sends the account id as x-user-id afterwards.
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  app.post('/auth/signup', async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    return reply.code(201).send(await provider.signUp(str(b.email), str(b.password), str(b.display_name)));
  });
  app.post('/auth/login', async (req) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    return provider.logIn(str(b.email), str(b.password));
  });
  app.get('/wallet', async (req, reply) => {
    const uid = userId(req, reply);
    return uid ? provider.getWallet(uid) : reply;
  });
  app.post('/wallet/topup', async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return reply;
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (b.method !== 'promptpay' && b.method !== 'card') return reply.code(400).send({ error: 'invalid_method' });
    return provider.topUp(uid, Number(b.amount_thb), b.method);
  });
  app.post('/tickets/:id/pay', async (req, reply) => {
    const uid = userId(req, reply);
    return uid ? provider.payTicket(uid, (req.params as { id: string }).id) : reply;
  });
  app.post('/demo/ticket', async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return reply;
    const b = (req.body ?? {}) as Record<string, unknown>;
    return reply.code(201).send(await provider.addDemoTicket(uid, str(b.plate_id), str(b.mall_id), Number(b.minutes_ago) || 0));
  });

  // WS /live: bay changes as they happen. Optional ?mall=<id> or ?floor=<id> filter.
  const wss = new WebSocketServer({ noServer: true });
  app.server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/live') return socket.destroy();
    const mall = url.searchParams.get('mall');
    const floor = url.searchParams.get('floor');
    wss.handleUpgrade(req, socket, head, (ws) => {
      const off = provider.onBayChanges((changes) => {
        const mine = changes.filter((c) => (!mall || c.mall_id === mall) && (!floor || c.floor_id === floor));
        if (mine.length) ws.send(JSON.stringify({ type: 'bay_changes', changes: mine }));
      });
      ws.on('close', off);
      ws.send(JSON.stringify({ type: 'hello', mall, floor }));
    });
  });
  app.addHook('onClose', async () => {
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  });

  return app;
}
