import { MapPin, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { Plate, Ticket } from '../lib/api';
import { clock, duration, timeOf } from '../lib/format';
import { elevation, radius, useTheme } from '../lib/theme';
import { CarTopView } from './CarTopView';
import { Button, Chip, Txt } from './ui';

/**
 * UI-35 to UI-39: "My parking" card. Parked: live hh:mm:ss timer and running fee, Navigate and Pay/End buttons.
 * Left: exit time, total time and amount paid. `now` is passed in so the parent drives the clock (and tests can fix it).
 */
export function SessionCard({ ticket, plate, mallName, place, now, onPay, onEnd, onNavigate, onSetPlace, busy }: {
  ticket: Ticket;
  plate?: Plate;
  mallName: string;
  place?: string; // "B2 · Zone C · C14" from "I parked here" (UI-39)
  now: number;
  onPay?: () => void;
  onEnd?: () => void;
  onNavigate?: () => void;
  onSetPlace?: () => void;
  busy?: boolean;
}) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const open = ticket.status === 'open';
  const start = Date.parse(ticket.entry_at);
  const end = open ? now : Date.parse(ticket.exit_at!);
  const due = Math.max(0, ticket.fee_thb - ticket.paid_thb);

  return (
    <View style={[styles.card, elevation(t), { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
      <View style={styles.head}>
        <Chip
          label={open ? tr('parking.parked') : tr('parking.left')}
          color={open ? t.success : t.neutral}
          tint={open ? t.freeFill : t.surface}
        />
        <Txt variant="caption" muted>{tr('parking.entered', { time: timeOf(ticket.entry_at, lang) })}</Txt>
      </View>

      <View style={styles.middle}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{plate ? `${plate.number} · ${plate.province}` : tr('parking.unknownPlate')}</Txt>
          {plate?.car_model && <Txt variant="caption" muted>{plate.car_model}</Txt>}
          <View style={styles.place}>
            <MapPin size={16} color={t.accentText} />
            <Txt variant="label" style={{ flexShrink: 1 }}>{place ? `${mallName} · ${place}` : mallName}</Txt>
          </View>
          {!place && open && onSetPlace && (
            <Button kind="ghost" small label={tr('parking.setPlace')} onPress={onSetPlace} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
          )}
        </View>
        {plate?.car_color && <CarTopView color={plate.car_color} size={110} />}
      </View>

      <View style={styles.numbers}>
        <View>
          <Txt variant="caption" muted>{open ? tr('parking.timeParked') : tr('parking.totalTime')}</Txt>
          <Txt variant="timer" accessibilityLabel={duration(end - start, tr)}>{clock(end - start)}</Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="caption" muted>{open ? tr('parking.amountDue') : tr('parking.amountPaid')}</Txt>
          <Txt variant="big">{tr('price.baht', { amount: open ? due : ticket.paid_thb })}</Txt>
        </View>
      </View>

      {open && ticket.paid_thb > 0 && (
        <Txt variant="caption" muted>{tr('parking.paidSoFar', { amount: ticket.paid_thb })}</Txt>
      )}
      {!open && (
        <Txt variant="caption" muted>
          {tr('parking.leftAt', { time: timeOf(ticket.exit_at!, lang) })} · {ticket.paid_from === 'gate' ? tr('parking.paidAtMachine') : tr('parking.paidFromWallet')}
          {ticket.validated ? ` · ${tr('tickets.validated')}` : ''}
        </Txt>
      )}

      {open && (
        <View style={styles.buttons}>
          {onNavigate && <Button icon={Navigation} label={tr('parking.navigate')} onPress={onNavigate} style={{ flex: 1 }} />}
          {due > 0 && onPay
            ? <Button primary label={tr('parking.pay', { amount: due })} onPress={onPay} disabled={busy} style={{ flex: 1 }} />
            : onEnd && <Button primary label={tr('parking.end')} onPress={onEnd} disabled={busy} style={{ flex: 1 }} />}
        </View>
      )}
      {open && due > 0 && onEnd && (
        <Button kind="ghost" small label={tr('parking.endAutoPay')} onPress={onEnd} disabled={busy} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.l, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  middle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  numbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 },
  buttons: { flexDirection: 'row', gap: 10 },
});
