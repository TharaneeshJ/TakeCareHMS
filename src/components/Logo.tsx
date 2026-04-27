// TakeCare HMS Logo — SVG cross + wordmark
interface LogoProps {
  dark?: boolean;   // true = white wordmark (dark background)
  size?: number;    // icon px
  fontSize?: number;
}

export function Logo({ dark = false, size = 20, fontSize = 17 }: LogoProps) {
  const wordColor = dark ? '#FFFFFF' : '#0A0A0A';
  const hmsColor = '#A3A3A3';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
        <rect x="9" y="0" width="4" height="22" rx="2" fill="#16A34A" />
        <rect x="0" y="9" width="22" height="4" rx="2" fill="#16A34A" />
      </svg>
      <span style={{ fontSize, lineHeight: 1, letterSpacing: '-0.025em', display: 'flex', alignItems: 'baseline', gap: '0px' }}>
        <span style={{ fontWeight: 700, color: wordColor, fontFamily: '"DM Sans", sans-serif' }}>TakeCare</span>
        <span style={{ fontWeight: 300, color: hmsColor, fontFamily: '"DM Sans", sans-serif' }}> HMS</span>
      </span>
    </div>
  );
}
