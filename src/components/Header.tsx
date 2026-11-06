const NAV = [
  { href: '#explore', label: 'Explore', short: 'Explore' },
  { href: '#history', label: 'Race History', short: 'History' },
  { href: '#timeline', label: 'Timeline', short: 'Timeline' },
  { href: '#achievements', label: 'Achievements', short: 'Records' },
];

export default function Header() {
  return (
    <header className="site-header">
      <a href="#explore" className="brand" aria-label="Running Atlas — home">
        <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <ellipse cx="16" cy="16" rx="5.5" ry="12.5" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
          <path d="M3.5 16h25" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
          <circle cx="19.5" cy="11.5" r="2.6" fill="#E8795C" />
        </svg>
        <span className="brand__text">
          <strong>Running Atlas</strong>
          <span>My Running Journey</span>
        </span>
      </a>
      <nav className="site-nav" aria-label="Sections">
        {NAV.map((n) => (
          <a key={n.href} href={n.href}>
            <span className="nav-long">{n.label}</span>
            <span className="nav-short">{n.short}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
