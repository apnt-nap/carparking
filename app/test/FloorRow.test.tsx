import { fireEvent, render, screen } from '@testing-library/react-native';
import { FloorRow } from '../src/components/FloorRow';
import type { FloorSummary } from '../src/lib/api';
import i18n from '../src/lib/i18n';

const floor: FloorSummary = {
  id: 'siam-paragon-b2', level: 'B2', order: 1, name_th: 'ชั้นใต้ดิน 2', name_en: 'Basement 2',
  free: 42, total: 120, best_choice: true,
  special: { ev: { free: 2, total: 6 }, accessible: { free: 1, total: 4 }, family: { free: 0, total: 4 } },
};

describe('FloorRow (FR-5 to FR-7)', () => {
  it('shows free spaces, Best choice and special bays in English', async () => {
    await i18n.changeLanguage('en');
    const onPress = jest.fn();
    await render(<FloorRow floor={floor} onPress={onPress} />);
    expect(screen.getByText('B2 · Basement 2')).toBeTruthy();
    expect(screen.getByText('42 / 120 free')).toBeTruthy();
    expect(screen.getByText('★ Best choice')).toBeTruthy();
    expect(screen.getByText(/EV 2\/6/)).toBeTruthy();
    // Screen readers get one label with everything (NFR-4)
    await fireEvent.press(screen.getByLabelText('B2 · Basement 2, 42 of 120 free, Best choice'));
    expect(onPress).toHaveBeenCalled();
  });

  it('switches to Thai', async () => {
    await i18n.changeLanguage('th');
    await render(<FloorRow floor={{ ...floor, best_choice: false }} onPress={() => {}} />);
    expect(screen.getByText('B2 · ชั้นใต้ดิน 2')).toBeTruthy();
    expect(screen.getByText('ว่าง 42 / 120')).toBeTruthy();
    expect(screen.queryByText(/แนะนำ/)).toBeNull();
  });
});
