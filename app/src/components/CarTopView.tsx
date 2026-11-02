import Svg, { Path, Rect } from 'react-native-svg';

/** UI-38: generic top-down car drawing, tinted with the user's car colour. Decorative. */
export function CarTopView({ color, size = 140 }: { color: string; size?: number }) {
  return (
    <Svg width={size * 0.55} height={size} viewBox="0 0 55 100" accessible={false}>
      <Rect x={4} y={4} width={47} height={92} rx={18} fill={color} />
      <Path d="M12 30 Q27.5 20 43 30 L41 42 Q27.5 37 14 42 Z" fill="#0B1B33" opacity={0.75} />
      <Path d="M14 70 Q27.5 66 41 70 L43 80 Q27.5 86 12 80 Z" fill="#0B1B33" opacity={0.6} />
      <Rect x={14} y={45} width={27} height={22} rx={5} fill="#FFFFFF" opacity={0.18} />
      <Rect x={1} y={34} width={4} height={8} rx={2} fill={color} />
      <Rect x={50} y={34} width={4} height={8} rx={2} fill={color} />
    </Svg>
  );
}
