'use client';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = '6px',
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    >
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}

// 预设骨架屏
export function SkeletonCard() {
  return (
    <div style={{
      padding: 20, background: '#fff', borderRadius: 12,
      border: '1px solid var(--color-gray-200)',
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Skeleton width={48} height={48} borderRadius="8px" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={12} />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
