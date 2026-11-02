import { MockParkingProvider } from './mockProvider.js';
import { buildServer } from './server.js';

const provider = MockParkingProvider.fromDir(new URL('../data/', import.meta.url));
provider.start(Number(process.env.SIM_INTERVAL_MS ?? 3000));

const app = buildServer(provider);
// 0.0.0.0 so a phone on the same Wi-Fi (Expo Go) can reach the server.
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
