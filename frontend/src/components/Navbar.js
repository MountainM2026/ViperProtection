import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const { pathname } = useLocation();

  const handleNavClick = (e, to) => {
    if (pathname === to) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setVisible(y < 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50
                     rounded-2xl px-6 py-3 flex items-center justify-between
                     transition-all duration-300
                     ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'}
                     ${scrolled
                       ? 'bg-green-950/30 backdrop-blur-2xl shadow-xl shadow-green-950/20 border border-green-500/20'
                       : 'bg-green-950/10 backdrop-blur-xl border border-green-500/10'
                     }`}>

      {/* Logo */}
      <Link to="/"
            className="flex items-center gap-2.5 text-[15px] font-bold text-green-400
                       hover:text-green-300 transition-all duration-200 hover:-translate-y-0.5">
        ViperProtection
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {[
          { to: '/',       label: 'Home'   },
          { to: '/upload', label: 'Upload' },
          { to: '/view',   label: 'View'   },
        ].map(({ to, label }) => (
          <Link key={to} to={to}
                onClick={(e) => handleNavClick(e, to)}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-200
                  ${pathname === to || pathname.startsWith(to + '/')
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/8'
                  }`}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}