import { fireEvent, render, screen } from '@testing-library/react-native';
import { MallCard } from '../src/components/MallCard';
import { PlateList } from '../src/components/PlateList';
import { PricesList } from '../src/components/PricesList';
import { SearchPopup } from '../src/components/SearchPopup';
import { SessionCard } from '../src/components/SessionCard';
import type { MallSummary, Plate, Ticket } from '../src/lib/api';
import i18n from '../src/lib/i18n';

const mall = (id: string, name: string, distance_km: number | null, hourly = 20, free = 50): MallSummary => ({
  id, name_th: name, name_en: name, brand: '', branch_th: '', branch_en: '', lat: 0, lng: 0, distance_km, free, total: 200,
  availability: free === 0 ? 'red' : 'green', fees_summary_th: '', fees_summary_en: '', area_th: 'สยาม', area_en: 'Siam',
  hours: { open: '10:00', close: '22:00' },
  fees: { free_minutes: 15, free_minutes_with_purchase: 120, hourly_thb: hourly, summary_th: '', summary_en: '' },
});
const plate: Plate = { id: 'p1', user_id: 'u', number: '1กก 1234', province: 'กรุงเทพมหานคร', consent_at: '', car_model: 'Honda City', car_color: '#1E64C8' };
const entry = '2026-11-02T07:00:00Z';
const open: Ticket = { id: 't1', plate_id: 'p1', mall_id: 'iconsiam', entry_at: entry, exit_at: null, fee_thb: 60, validated: false, status: 'open', paid_thb: 0, paid_at: null, paid_from: null };

beforeEach(() => i18n.changeLanguage('en'));

describe('SearchPopup (UI-5, UI-6)', () => {
  it('shows at most 3 malls with distance, spots and price, and picks one', async () => {
    const onPick = jest.fn();
    const malls = [mall('a', 'Alpha', 0.4), mall('b', 'Beta', 1.2), mall('c', 'Gamma', 3), mall('d', 'Delta', 9)];
    await render(<SearchPopup title="Nearest to you" malls={malls} onPick={onPick} emptyText="none" />);
    expect(screen.getByText('Nearest to you')).toBeTruthy();
    expect(screen.queryByText('Delta')).toBeNull();
    expect(screen.getAllByText('20 ฿/hr · first 2 hr free with purchase')).toHaveLength(3);
    await fireEvent.press(screen.getByRole('button', { name: /^Beta, 1.2 km/ }));
    expect(onPick).toHaveBeenCalledWith(malls[1]);
  });
});

describe('MallCard and Prices (UI-41 to UI-43)', () => {
  it('card shows name, area, spots in words, price per hour and Choose a spot', async () => {
    const onChoose = jest.fn();
    await render(<MallCard mall={mall('a', 'Siam Paragon', 0.4, 20, 312)} onChoose={onChoose} onOpen={() => {}} />);
    expect(screen.getByText('Siam Paragon')).toBeTruthy();
    expect(screen.getByText('312 spots available')).toBeTruthy();
    expect(screen.getByText('20 ฿/hr')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Choose a spot' }));
    expect(onChoose).toHaveBeenCalled();
  });

  it('a full mall says Full and cannot be chosen', async () => {
    const onChoose = jest.fn();
    await render(<MallCard mall={mall('a', 'Lotus', 1, 10, 0)} onChoose={onChoose} onOpen={() => {}} />);
    expect(screen.getByText('Full')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Choose a spot' }));
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('Prices view lists every mall, cheapest first, and can sort by distance', async () => {
    await render(<PricesList malls={[mall('a', 'Pricey', 0.5, 30), mall('b', 'Cheap', 9, 10), mall('c', 'Mid', 3, 20)]} />);
    const names = () => screen.getAllByText(/^(Pricey|Cheap|Mid)$/).map((n) => n.props.children);
    expect(names()).toEqual(['Cheap', 'Mid', 'Pricey']);
    expect(screen.getByText('10 ฿/hr')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Nearest' }));
    expect(names()).toEqual(['Pricey', 'Mid', 'Cheap']);
  });
});

describe('SessionCard (UI-35 to UI-37)', () => {
  it('parked: live hh:mm:ss timer, running fee, plate and car, Pay and Navigate', async () => {
    const onPay = jest.fn();
    const now = Date.parse(entry) + (1 * 3600 + 50 * 60 + 59) * 1000;
    await render(<SessionCard ticket={open} plate={plate} mallName="ICONSIAM" place="B2 Zone C · C014" now={now} onPay={onPay} onEnd={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText('Parked')).toBeTruthy();
    expect(screen.getByText('01:50:59')).toBeTruthy();
    expect(screen.getByText('60 ฿')).toBeTruthy();
    expect(screen.getByText('1กก 1234 · กรุงเทพมหานคร')).toBeTruthy();
    expect(screen.getByText('Honda City')).toBeTruthy();
    expect(screen.getByText('ICONSIAM · B2 Zone C · C014')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Navigate to my car' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Pay 60 ฿' }));
    expect(onPay).toHaveBeenCalled();
  });

  it('the timer moves with the clock', async () => {
    const { rerender } = await render(<SessionCard ticket={open} mallName="X" now={Date.parse(entry) + 5000} />);
    expect(screen.getByText('00:00:05')).toBeTruthy();
    await rerender(<SessionCard ticket={open} mallName="X" now={Date.parse(entry) + 65000} />);
    expect(screen.getByText('00:01:05')).toBeTruthy();
  });

  it('after exit: Left, total time, amount paid, no action buttons (UI-36)', async () => {
    const left: Ticket = { ...open, status: 'closed', exit_at: '2026-11-02T09:10:00Z', fee_thb: 60, paid_thb: 60, paid_from: 'wallet', paid_at: '2026-11-02T09:10:00Z' };
    await render(<SessionCard ticket={left} plate={plate} mallName="ICONSIAM" now={Date.now()} onPay={() => {}} onEnd={() => {}} />);
    expect(screen.getByText('Left')).toBeTruthy();
    expect(screen.getByText('Total time')).toBeTruthy();
    expect(screen.getByText('02:10:00')).toBeTruthy();
    expect(screen.getByText('Amount paid')).toBeTruthy();
    expect(screen.getByText(/Paid from wallet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Pay|End parking/ })).toBeNull();
  });
});

describe('PlateList in Parking & Pay (UI-18, UI-24)', () => {
  it('is read-only: shows plates and which is parked, with no way to add a plate', async () => {
    await render(<PlateList plates={[plate, { ...plate, id: 'p2', number: 'กข 77', car_model: undefined }]} parkedPlateIds={new Set(['p1'])} />);
    expect(screen.getByText('1กก 1234 · กรุงเทพมหานคร')).toBeTruthy();
    expect(screen.getAllByText('Parked')).toHaveLength(1);
    expect(screen.queryByText(/Add plate/)).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
