export type AvatarTone = 'amber' | 'mint' | 'peri' | 'rose';

interface AvatarProps {
  name: string;
  tone?: AvatarTone;
  size?: number;
}

export const toneColors: Record<AvatarTone, [string, string]> = {
  amber: ['var(--bg-2)', 'var(--amber)'],
  mint: ['var(--bg-2)', 'var(--mint)'],
  peri: ['var(--bg-2)', 'var(--peri)'],
  rose: ['var(--bg-2)', 'var(--rose)'],
};

export const avatarTones: AvatarTone[] = ['amber', 'mint', 'peri', 'rose'];

export function hashString(value: string): number {
  const normalized = value.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
  }
  return hash >>> 0;
}

export function toneForName(name: string): AvatarTone {
  return avatarTones[hashString(name || '?') % avatarTones.length];
}

/** Stable identity initials on a neutral tile; capsules carry actual status. */

export const Avatar = ({ name, tone, size = 28 }: AvatarProps) => {
  const resolvedTone = tone || toneForName(name);
  const [bg, fg] = toneColors[resolvedTone] || toneColors.amber;
  const initial = ((name || '?').trim() || '?').slice(0, 1).toUpperCase();

  return (
    <span
      className="identity-avatar"
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-2)',
        background: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--sans)',
        fontWeight: 600,
        // Proportional to the `size` prop, so it cannot be a fixed step from the
        // type scale. The avatar is a glyph, not prose, and has no breakpoint
        // behaviour to lose — the one case the ratchet cannot express.
        // eslint-disable-next-line no-restricted-syntax
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
};
