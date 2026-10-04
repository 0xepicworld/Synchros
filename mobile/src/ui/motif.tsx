import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs } from 'react-native-svg';

import { useColors } from '@/theme';

import { T } from './text';

/**
 * The Synchros motif: two circles. Left is your inner world (intentions),
 * right is the outer world (signs). The lens where they overlap is a thread:
 * a sign you connected to an intention.
 *
 * In the Today view the overlap is data: the more of this week's signs are
 * threaded to an intention, the closer the circles draw together.
 */
export function Rings({
  inner,
  outer,
  threads,
  size = 300,
}: {
  inner: number;
  outer: number;
  threads: number;
  size?: number;
}) {
  const c = useColors();
  const share = outer > 0 ? threads / outer : 0;
  const h = size * 0.62;
  const r = h * 0.44;
  // Distance between centres: 1.7r when nothing is threaded, 0.9r when everything is.
  const d = r * (1.7 - 0.8 * share);
  const cy = h / 2;
  const cx1 = size / 2 - d / 2;
  const cx2 = size / 2 + d / 2;
  const lensX = size / 2;

  const label = `${inner} active intentions, ${outer} signs this week, ${threads} threaded together`;

  return (
    <View style={{ width: size, height: h }} accessible accessibilityLabel={label}>
      <Svg width={size} height={h}>
        <Defs>
          <ClipPath id="innerClip">
            <Circle cx={cx1} cy={cy} r={r} />
          </ClipPath>
        </Defs>
        <Circle cx={cx1} cy={cy} r={r} fill={c.innerSoft} />
        <Circle cx={cx2} cy={cy} r={r} fill={c.outerSoft} />
        <Circle cx={cx2} cy={cy} r={r} fill={c.thread} opacity={0.28} clipPath="url(#innerClip)" />
        <Circle cx={cx1} cy={cy} r={r} fill="none" stroke={c.inner} strokeWidth={2.5} />
        <Circle cx={cx2} cy={cy} r={r} fill="none" stroke={c.outer} strokeWidth={2.5} />
      </Svg>

      <View style={[styles.slot, { left: cx1 - r, width: (cx2 - r) - (cx1 - r), top: 0, height: h }]}>
        <T variant="number" color="inner">
          {inner}
        </T>
        <T variant="caption" color="inkSoft">
          intentions
        </T>
      </View>
      <View style={[styles.slot, { left: cx1 + r, width: cx2 + r - (cx1 + r), top: 0, height: h }]}>
        <T variant="number" style={{ color: c.outer }}>
          {outer}
        </T>
        <T variant="caption" color="inkSoft">
          signs
        </T>
      </View>
      <View style={[styles.lens, { left: lensX - 30, top: h / 2 - 22 }]}>
        <T variant="heading" color="thread" center>
          {threads}
        </T>
        <T variant="caption" color="inkSoft" center>
          threads
        </T>
      </View>
    </View>
  );
}

/** Brand mark: two interlocking rings on a diagonal, the lens filled with thread colour. */
export function Mark({ size = 56 }: { size?: number }) {
  const c = useColors();
  const r = size * 0.27;
  const sw = size * 0.08;
  const d = (r * 0.62) / Math.SQRT2;
  const a = { x: size / 2 - d, y: size / 2 - d };
  const b = { x: size / 2 + d, y: size / 2 + d };
  return (
    <Svg width={size} height={size} accessibilityLabel="Synchros">
      <Defs>
        <ClipPath id="markClip">
          <Circle cx={a.x} cy={a.y} r={r} />
        </ClipPath>
      </Defs>
      <Circle cx={b.x} cy={b.y} r={r} fill={c.thread} clipPath="url(#markClip)" />
      <Circle cx={a.x} cy={a.y} r={r} fill="none" stroke={c.inner} strokeWidth={sw} />
      <Circle cx={b.x} cy={b.y} r={r} fill="none" stroke={c.outer} strokeWidth={sw} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  lens: { position: 'absolute', width: 60, alignItems: 'center' },
});
