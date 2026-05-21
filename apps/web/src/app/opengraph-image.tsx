import { ImageResponse } from 'next/og';

export const alt = 'PackYourBag! — Your modular packing list companion';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const COLORS = {
  background: '#f0f6fa',
  surface: '#ffffff',
  primary: '#0e7093',
  foreground: '#111c22',
  muted: '#4a6472',
  info: '#38bdf8',
  primaryRing: '#bae6fd',
  success: '#15803d',
  successBg: '#dcfce7',
  ocean: '#0e7fa8',
  sand: '#d97706',
  coral: '#f43f5e',
  jungle: '#16a34a',
};

const features = [
  { label: 'Items', color: COLORS.ocean },
  { label: 'Lists', color: COLORS.sand },
  { label: 'Packs', color: COLORS.coral },
  { label: 'Trips', color: COLORS.jungle },
] as const;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: COLORS.background,
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.surface,
            borderRadius: '24px',
            border: `2px solid ${COLORS.primaryRing}`,
            padding: '50px 80px',
            gap: '8px',
            boxShadow: '0 4px 24px rgba(14, 112, 147, 0.08)',
          }}
        >
          {/* Hiking icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80">
            <path
              fill={COLORS.info}
              d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 5.28c-1.23-.37-2.22-1.17-2.8-2.18l-1-1.6c-.41-.65-1.11-1-1.84-1-.78 0-1.59.5-1.78 1.44S7 23 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1 1.15 2.41 2.01 4 2.34V23H19V9h-1.5v1.78zM7.43 13.13l-2.12-.41a.999.999 0 0 1-.79-1.17l.76-3.93a2 2 0 0 1 2.34-1.58l1.16.23-1.35 6.86z"
            />
          </svg>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            <span
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: COLORS.primary,
                lineHeight: 1,
              }}
            >
              PackYourBag!
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: COLORS.success,
                backgroundColor: COLORS.successBg,
                padding: '4px 12px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Free
            </span>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: '24px',
              color: COLORS.muted,
              marginTop: '4px',
            }}
          >
            Your modular packing list companion
          </span>

          {/* Feature dots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              marginTop: '28px',
            }}
          >
            {features.map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: f.color,
                  }}
                />
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: COLORS.foreground,
                  }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <span
            style={{
              fontSize: '20px',
              color: COLORS.muted,
              marginTop: '28px',
              fontStyle: 'italic',
            }}
          >
            Forget nothing. Enjoy your trip.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
