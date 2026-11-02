import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../src/lib/api';
import { getMode } from '../src/lib/dataSource';
import { LocalParkingProvider, localProvider } from '../src/lib/localProvider';

afterAll(async () => (await localProvider()).stop());

describe('demo mode (on-phone LocalParkingProvider)', () => {
  it('is the default when EXPO_PUBLIC_API_URL is not set', () => {
    expect(process.env.EXPO_PUBLIC_API_URL).toBeUndefined();
    expect(getMode()).toBe('demo');
  });

  it('answers the same calls as the server, with bundled data', async () => {
    const malls = await api.malls({ lat: 13.7466, lng: 100.5393 });
    expect(malls).toHaveLength(5);
    expect(malls[0].id).toBe('centralworld');
    const mall = await api.mall('siam-paragon', 'free');
    expect(mall.floors[0].best_choice).toBe(true);
    const floor = await api.floor('iconsiam-b1');
    expect(floor.bays[0]).toHaveProperty('status');
    expect((await api.search('พารากอน', 'th'))[0].id).toBe('siam-paragon');
    await expect(api.mall('nope', 'free')).rejects.toMatchObject({ status: 404 });
  });

  it('rejects bad plates like the server does (400)', async () => {
    await expect(api.addPlate('ABC123', 'กรุงเทพมหานคร')).rejects.toBeInstanceOf(ApiError);
    await expect(api.addPlate('1กก 1234', 'Bangkok')).rejects.toMatchObject({ status: 400 });
  });

  it('runs the full gate flow on the phone', async () => {
    const plate = await api.addPlate('1กก 1234', 'กรุงเทพมหานคร');
    const entry = await api.gate({ mall_id: 'iconsiam', plate_number: '1กก1234', province: 'กรุงเทพมหานคร', direction: 'entry' });
    expect(entry.action).toBe('open_gate');
    expect((await api.tickets())[0].status).toBe('open');
    const exit = await api.gate({ mall_id: 'iconsiam', plate_number: '1กก1234', province: 'กรุงเทพมหานคร', direction: 'exit', validated: true });
    expect(exit.action === 'open_gate' && exit.ticket.status).toBe('closed');
    const stranger = await api.gate({ mall_id: 'iconsiam', plate_number: 'กข 9999', province: 'ชลบุรี', direction: 'entry' });
    expect(stranger).toEqual({ action: 'fallback_ticket', reason: 'unregistered' });

    // Plates and tickets survive an app restart (a fresh provider reads AsyncStorage)
    const restarted = await LocalParkingProvider.create();
    const userPlates = await restarted.listPlates(plate.user_id);
    expect(userPlates.map((p) => p.id)).toEqual([plate.id]);
    expect(await restarted.listTickets(plate.user_id)).toHaveLength(1);

    await api.deletePlate(plate.id);
    expect(await api.plates()).toEqual([]);
    expect(JSON.parse((await AsyncStorage.getItem('app.demoState'))!).plates).toEqual([]);
  });

  it('pushes live bay changes from the on-phone simulator (FR-11)', async () => {
    const p = await localProvider();
    const seen: unknown[] = [];
    const off = p.onBayChanges((c) => seen.push(...c));
    for (let i = 0; i < 5; i++) p.tick();
    off();
    expect(seen.length).toBeGreaterThan(0);
  });
});
