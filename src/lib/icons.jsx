// Icon set ported from the uploaded CareShift design reference (app/care-views.jsx).
function Svg({ children, ...props }) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  )
}

export const Icon = {
  home: (p) => <Svg {...p}><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></Svg>,
  plus: (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>,
  calendar: (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>,
  user: (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>,
  users: (p) => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></Svg>,
  bell: (p) => <Svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></Svg>,
  shield: (p) => <Svg {...p}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10V6L12 3Z" /><path d="m9 12 2 2 4-4" /></Svg>,
  building: (p) => <Svg {...p}><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 9h2a2 2 0 0 1 2 2v10M8 7h5M8 11h5M8 15h5M9 21v-2h3v2M3 21h19" /></Svg>,
  chart: (p) => <Svg {...p}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></Svg>,
  settings: (p) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></Svg>,
  pin: (p) => <Svg {...p}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></Svg>,
  clock: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  check: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></Svg>,
  search: (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Svg>,
  file: (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></Svg>,
  chevron: (p) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>,
  more: (p) => <Svg {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Svg>,
  close: (p) => <Svg {...p}><path d="m6 6 12 12M18 6 6 18" /></Svg>,
  menu: (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>,
  help: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.9.5-1.2 1-1.2 1.8M12 17h.01" /></Svg>,
  upload: (p) => <Svg {...p}><path d="M12 16V4M7 9l5-5 5 5M4 15v4h16v-4" /></Svg>,
  info: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></Svg>,
  down: (p) => <Svg {...p}><path d="m7 10 5 5 5-5" /></Svg>,
}

export function IconGlyph({ name, ...props }) {
  const Cmp = Icon[name]
  if (!Cmp) return null
  return <Cmp {...props} />
}
