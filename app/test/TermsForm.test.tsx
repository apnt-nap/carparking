import { fireEvent, render, screen } from '@testing-library/react-native';
import { TermsForm } from '../src/components/TermsForm';
import i18n from '../src/lib/i18n';

describe('TermsForm (FR-21: consent before plate entry)', () => {
  beforeEach(() => i18n.changeLanguage('en'));

  it('only allows Accept after both the terms and PDPA boxes are ticked', async () => {
    const onAccept = jest.fn();
    await render(<TermsForm onAccept={onAccept} onDecline={() => {}} />);
    const accept = screen.getByRole('button', { name: 'Accept and continue' });

    await fireEvent.press(accept);
    expect(onAccept).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'I have read and accept the Terms & Agreement.' }));
    await fireEvent.press(accept);
    expect(onAccept).not.toHaveBeenCalled(); // PDPA box still unticked

    await fireEvent.press(screen.getByRole('checkbox', { name: /PDPA/ }));
    await fireEvent.press(accept);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('can be declined, and is shown in Thai', async () => {
    await i18n.changeLanguage('th');
    const onDecline = jest.fn();
    await render(<TermsForm onAccept={() => {}} onDecline={onDecline} />);
    expect(screen.getByText('ข้อกำหนดและข้อตกลงการเข้าออกไม่ต้องใช้บัตร')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'ไว้ทีหลัง' }));
    expect(onDecline).toHaveBeenCalled();
  });
});
