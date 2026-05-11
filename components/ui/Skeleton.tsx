import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

const BASE   = '#E5EAF0';
const SHIM_W = 220;

/* ── Primitive ─────────────────────────────────────────────── */
export default function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | `${number}%` | 'auto';
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const shimX = useRef(new Animated.Value(-SHIM_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimX, {
        toValue: 400,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [shimX]);

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: BASE, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          s.shimmer,
          { transform: [{ translateX: shimX }] },
        ]}
      />
    </View>
  );
}

/* ── Variantes ─────────────────────────────────────────────── */
export function SkeletonText({
  width = '80%',
  height = 14,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}) {
  return <Skeleton width={width} height={height} borderRadius={6} style={style} />;
}

export function SkeletonCard({
  height = 80,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  return <Skeleton width="100%" height={height} borderRadius={14} style={style} />;
}

export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

/* ── Skeleton card RDV ─────────────────────────────────────── */
export function SkeletonRDVCard() {
  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        <SkeletonAvatar size={42} />
        <View style={s.cardMid}>
          <SkeletonText width="55%" height={15} />
          <SkeletonText width="38%" height={11} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={64} height={22} borderRadius={999} />
      </View>
      <SkeletonText width="88%" height={11} style={{ marginTop: 10 }} />
      <SkeletonText width="65%" height={11} style={{ marginTop: 6 }} />
    </View>
  );
}

/* ── Skeleton mission card ─────────────────────────────────── */
export function SkeletonMissionCard() {
  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        <Skeleton width={46} height={46} borderRadius={12} />
        <View style={s.cardMid}>
          <SkeletonText width="60%" height={15} />
          <SkeletonText width="42%" height={11} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={[s.cardRow, { marginTop: 10, gap: 8 }]}>
        <Skeleton width={70} height={20} borderRadius={999} />
        <Skeleton width={90} height={20} borderRadius={999} />
      </View>
    </View>
  );
}

/* ── Skeleton formation card ───────────────────────────────── */
export function SkeletonFormationCard() {
  return (
    <View style={[s.card, { gap: 10 }]}>
      <View style={s.cardRow}>
        <Skeleton width={50} height={50} borderRadius={14} />
        <View style={s.cardMid}>
          <SkeletonText width="65%" height={16} />
          <SkeletonText width="45%" height={11} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={56} height={22} borderRadius={999} />
      </View>
      <SkeletonText width="92%" height={11} />
      <SkeletonText width="75%" height={11} />
      <View style={[s.cardRow, { gap: 8 }]}>
        <Skeleton width={80} height={18} borderRadius={999} />
        <Skeleton width={80} height={18} borderRadius={999} />
      </View>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────── */
const s = StyleSheet.create({
  shimmer: {
    width: SHIM_W,
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardMid: {
    flex: 1,
    gap: 4,
  },
});
