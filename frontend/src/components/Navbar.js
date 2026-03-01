import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ViperShieldIcon from './ViperShieldIcon';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  const handleNavClick = (e, to) => {
    if (pathname === to) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50
                     rounded-2xl px-6 py-3 flex items-center justify-between
                     transition-all duration-300
                     ${scrolled
                       ? 'bg-gray-950/80 backdrop-blur-xl shadow-xl shadow-black/40 border border-gray-700/60'
                       : 'bg-gray-950/60 backdrop-blur-lg border border-gray-700/40'
                     }`}>

      {/* Logo */}
      <Link to="/"
            className="flex items-center gap-2.5 text-[15px] font-bold text-white
                       hover:text-green-400 transition-colors duration-200">
        <div className="w-7 h-7 rounded-lg bg-green-500/15 border border-green-500/25
                        flex items-center justify-center overflow-hidden">
          <ViperShieldIcon size={18} />
        </div>
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