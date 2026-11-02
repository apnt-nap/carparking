import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { G, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { Bay, FloorDetail } from '../lib/api';
import { pick } from '../lib/i18n';
import type { Route } from '../lib/route';
import { useTheme } from '../lib/theme';

const ICON: Record<Bay['type'], string> = { ev: '⚡', accessible: '♿', family: '👪', normal: '' };

interface Props {
  floor: FloorDetail;
  route?: Route;
  parkedBayId?: string;
  onBayPress: (bay: Bay) => void;
  width: number; // on-screen width in points
}

/** FR-9 to FR-14: top-down floor plan drawn from the geometry in metres. Pinch to zoom, drag to pan. */
export function FloorPlan({ floor, route, parkedBayId, onBayPress, width }: Props) {
  const t = useTheme();
  const { i18n } = useTranslation();
  const { plan } = floor;
  const height = (width * plan.height) / plan.width;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = usePinchGesture({
    onUpdate: (e) => { 'worklet'; scale.value = Math.min(6, Math.max(1, savedScale.value * e.scale)); },
    onDeactivate: () => { 'worklet'; savedScale.value = scale.value; },
  });
  const pan = usePanGesture({
    minDistance: 8, // small movements stay taps on bays
    onUpdate: (e) => { 'worklet'; tx.value = savedTx.value + e.translationX; ty.value = savedTy.value + e.translationY; },
    onDeactivate: () => { 'worklet'; savedTx.value = tx.value; savedTy.value = ty.value; },
  });
  const gesture = useSimultaneousGestures(pinch, pan);
  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const nodes = useMemo(() => new Map(plan.nodes.map((n) => [n.id, n])), [plan.nodes]);

  // FR-14: one label per zone, at the middle of its bays.
  const zones = useMemo(() => {
    const acc = new Map<string, { x: number; y: number; n: number }>();
    for (const b of floor.bays) {
      const z = acc.get(b.zone) ?? { x: 0, y: 0, n: 0 };
      acc.set(b.zone, { x: z.x + b.x + b.w / 2, y: z.y + b.y + b.h / 2, n: z.n + 1 });
    }
    return [...acc].map(([zone, z]) => ({ zone, x: z.x / z.n, y: z.y / z.n }));
  }, [floor.bays]);

  return (
    <View style={[styles.frame, { width, height, borderColor: t.border, backgroundColor: t.bg }]}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width, height }, zoomStyle]}>
          <Svg width={width} height={height} viewBox={`0 0 ${plan.width} ${plan.height}`}>
            <Rect {...plan.outline} fill={t.card} stroke={t.text} strokeWidth={0.4} />

            {/* Lanes with one-way arrows on every 4th segment */}
            {plan.edges.map((e, i) => {
              const a = nodes.get(e.from)!;
              const b = nodes.get(e.to)!;
              return (
                <G key={`${e.from}-${e.to}`}>
                  <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={t.lane} strokeWidth={3} strokeLinecap="round" />
                  {e.one_way && i % 4 === 0 && <Arrow ax={a.x} ay={a.y} bx={b.x} by={b.y} color={t.muted} />}
                </G>
              );
            })}

            {plan.ramps.map((r) => (
              <G key={r.id}>
                <Rect x={r.x} y={r.y} width={r.w} height={r.h} fill={t.ramp} />
                <SvgText x={r.x + r.w / 2} y={r.y + r.h / 2 + 0.8} fontSize={2} textAnchor="middle" fill={t.text}>
                  {r.kind === 'entry' ? '⬇' : '⬆'}
                </SvgText>
              </G>
            ))}
            {plan.lobbies.map((l) => (
              <G key={l.id}>
                <Rect x={l.x} y={l.y} width={l.w} height={l.h} fill={t.lobby} rx={0.6} />
                <SvgText x={l.x + l.w / 2} y={l.y + l.h / 2 + 0.8} fontSize={2.2} textAnchor="middle" fill={t.text}>
                  {`🛗 ${pick(l, 'label', i18n.language)}`}
                </SvgText>
              </G>
            ))}

            <Bays bays={floor.bays} selectedId={route?.bay.id} parkedBayId={parkedBayId} onBayPress={onBayPress} lang={i18n.language} />

            {zones.map((z) => (
              <SvgText key={z.zone} x={z.x} y={z.y + 1.2} fontSize={3.2} fontWeight="bold" textAnchor="middle" fill={t.muted} opacity={0.5}>
                {z.zone}
              </SvgText>
            ))}

            {route && (
              <Polyline
                points={route.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke={t.route} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round"
              />
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function Arrow({ ax, ay, bx, by, color }: { ax: number; ay: number; bx: number; by: number; color: string }) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const angle = Math.atan2(by - ay, bx - ax);
  const p = (d: number, a: number) => `${mx + d * Math.cos(angle + a)},${my + d * Math.sin(angle + a)}`;
  return <Polygon points={`${p(1, 0)} ${p(0.9, 2.5)} ${p(0.9, -2.5)}`} fill={color} />;
}

/** Bays are memoised separately so pan/zoom never re-renders 250 rectangles. */
const Bays = memo(function Bays({ bays, selectedId, parkedBayId, onBayPress, lang }: {
  bays: Bay[]; selectedId?: string; parkedBayId?: string; onBayPress: (b: Bay) => void; lang: string;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <>
      {bays.map((b) => {
        const free = b.status === 'free';
        const selected = b.id === selectedId;
        const parked = b.id === parkedBayId;
        const label = tr('floor.bayLabel', {
          id: b.id.slice(-4), zone: pick(b, 'zone_name', lang), status: tr(free ? 'floor.free' : 'floor.taken'),
          type: b.type === 'normal' ? '' : `, ${tr(`bayType.${b.type}`)}`,
        });
        return (
          <G key={b.id} onPress={free ? () => onBayPress(b) : undefined} accessibilityLabel={label}>
            <Rect
              x={b.x + 0.1} y={b.y + 0.1} width={b.w - 0.2} height={b.h - 0.2} rx={0.3}
              fill={free ? t.freeFill : t.takenFill}
              stroke={selected ? t.route : parked ? t.amber : free ? t.free : t.taken}
              strokeWidth={selected || parked ? 0.5 : 0.15}
            />
            {/* NFR-4: taken bays are also crossed out, so colour is not the only signal */}
            {!free && (
              <>
                <Line x1={b.x + 0.4} y1={b.y + 0.4} x2={b.x + b.w - 0.4} y2={b.y + b.h - 0.4} stroke={t.taken} strokeWidth={0.15} />
                <Line x1={b.x + b.w - 0.4} y1={b.y + 0.4} x2={b.x + 0.4} y2={b.y + b.h - 0.4} stroke={t.taken} strokeWidth={0.15} />
              </>
            )}
            {(b.type !== 'normal' || parked) && (
              <SvgText x={b.x + b.w / 2} y={b.y + b.h / 2 + 0.6} fontSize={1.6} textAnchor="middle">
                {parked ? '🚗' : ICON[b.type]}
              </SvgText>
            )}
          </G>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
});
