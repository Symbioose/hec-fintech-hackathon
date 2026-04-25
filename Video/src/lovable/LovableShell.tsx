import {LV} from '../design/tokens';

type NavKey = 'dashboard' | 'recommendations' | 'products' | 'inbox' | 'mandate' | 'market' | 'watchlist';

interface Props {
  active: NavKey;
  user?: {name: string; firm: string};
  children: React.ReactNode;
}

const NAV: Array<{key: NavKey; label: string; glyph: string}> = [
  {key: 'dashboard', label: 'Dashboard', glyph: 'M3 12L12 3l9 9M5 10v10h14V10'},
  {key: 'recommendations', label: 'Recommendations', glyph: 'M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.5 5.7 21l2.3-7.3-6-4.5h7.6z'},
  {key: 'products', label: 'Products', glyph: 'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7'},
  {key: 'inbox', label: 'Inbox', glyph: 'M3 7v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-9 6-9-6z'},
  {key: 'mandate', label: 'My Mandate', glyph: 'M9 12l2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'},
  {key: 'market', label: 'Market views', glyph: 'M3 17l6-6 4 4 8-8M21 7h-5M21 7v5'},
  {key: 'watchlist', label: 'Watchlist', glyph: 'M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'},
];

/**
 * App shell: sidebar with nav + main content area. Mirrors the
 * Lovable AppLayout so the in-video product scenes are visually
 * identical to the deployed app.
 */
export const LovableShell: React.FC<Props> = ({
  active,
  user = {name: 'Marie Lefèvre', firm: 'Atlas Multi-Asset Fund'},
  children,
}) => {
  return (
    <>
      <Sidebar active={active} user={user} />
      <main style={{flex: 1, overflow: 'hidden', position: 'relative', background: LV.bg}}>{children}</main>
    </>
  );
};

const Sidebar: React.FC<{active: NavKey; user: {name: string; firm: string}}> = ({active, user}) => (
  <aside
    style={{
      width: 232,
      background: LV.sidebar,
      borderRight: `1px solid ${LV.sidebarBorder}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      gap: 4,
    }}
  >
    <div style={{padding: '8px 10px 14px 10px', display: 'flex', alignItems: 'center', gap: 10}}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: LV.gradientPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 15,
          fontWeight: 800,
          boxShadow: '0 6px 16px rgba(99, 102, 241, 0.45)',
        }}
      >
        F
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <span style={{fontSize: 14, fontWeight: 700, color: LV.textPrimary, letterSpacing: -0.1}}>FlowDesk</span>
        <span style={{fontSize: 10, color: LV.textMuted, letterSpacing: 1.5, textTransform: 'uppercase'}}>
          Copilot
        </span>
      </div>
    </div>

    <div style={{height: 1, background: LV.sidebarBorder, margin: '4px 10px 8px 10px'}} />

    <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
      {NAV.map((item) => (
        <NavRow key={item.key} item={item} active={item.key === active} />
      ))}
    </div>

    <div style={{flex: 1}} />

    <div
      style={{
        padding: '12px 10px',
        borderTop: `1px solid ${LV.sidebarBorder}`,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: LV.gradientAccent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {user.name
          .split(' ')
          .map((s) => s[0])
          .slice(0, 2)
          .join('')}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0}}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LV.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.name}
        </span>
        <span
          style={{
            fontSize: 10,
            color: LV.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.firm}
        </span>
      </div>
    </div>
  </aside>
);

const NavRow: React.FC<{item: {key: NavKey; label: string; glyph: string}; active: boolean}> = ({
  item,
  active,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '9px 12px',
      borderRadius: 8,
      background: active ? LV.sidebarAccent : 'transparent',
      color: active ? LV.textPrimary : LV.textMuted,
      borderLeft: active ? `2px solid ${LV.primary}` : '2px solid transparent',
      paddingLeft: active ? 10 : 12,
    }}
  >
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d={item.glyph} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{fontSize: 13, fontWeight: active ? 600 : 500, letterSpacing: -0.05}}>{item.label}</span>
  </div>
);
