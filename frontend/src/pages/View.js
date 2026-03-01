import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Download, Eye, EyeOff, Image as ImageIcon, AlertCircle, Search } from 'lucide-react';
import ViperShieldIcon from '../components/ViperShieldIcon';

const fadeUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const BASE_URL = "http://127.0.0.1:8000";

export default function View() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Lookup form state (shown when no ID in URL)
  const [inputId, setInputId]                     = useState('');
  const [inputPassword, setInputPassword]         = useState('');
  const [showInputPassword, setShowInputPassword] = useState(false);

  // Protected image state
  const [imageData, setImageData]       = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError]     = useState(false);

  // Original image state
  const [password, setPassword]               = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [originalSrc, setOriginalSrc]         = useState(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [originalError, setOriginalError]     = useState('');
  const [unlocked, setUnlocked]               = useState(false);

  /* ─── Fetch protected image when ID is in URL ─── */
  useEffect(() => {
    if (!id) return;
    setLoadingImage(true);
    setImageError(false);
    setImageData(null);
    setUnlocked(false);
    setOriginalSrc(null);

    const fetchImage = async () => {
      try {
        const res = await fetch(`${BASE_URL}/images/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setImageData(data);
      } catch {
        setImageError(true);
      } finally {
        setLoadingImage(false);
      }
    };
    fetchImage();
  }, [id]);

  /* ─── Navigate to image from lookup form ─── */
  const handleLookup = () => {
    if (!inputId) return;
    if (inputPassword) setPassword(inputPassword);
    navigate(`/view/${inputId}`);
  };

  /* ─── Fetch original with password ─── */
  const handleUnlock = async () => {
    if (!password) return;
    setLoadingOriginal(true);
    setOriginalError('');

    try {
      const res = await fetch(`${BASE_URL}/images/${id}/original`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setOriginalError('Incorrect password. Please try again.');
        return;
      }

      const blob = await res.blob();
      setOriginalSrc(URL.createObjectURL(blob));
      setUnlocked(true);
    } catch {
      setOriginalError('Could not connect to server.');
    } finally {
      setLoadingOriginal(false);
    }
  };

  /* ─── Download helper ─── */
  const handleDownload = (src, label) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `viper-${label}-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ══════════════════════════════════════
     DEFAULT STATE: no ID → show lookup form
  ══════════════════════════════════════ */
  if (!id) {
    return (
      <div className="relative min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-md">

          <div className="text-center mb-10">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">Retrieve Image</p>
            <h1 className="text-4xl font-black mb-3 leading-tight">View Protected Asset</h1>
            <p className="text-gray-400 text-base max-w-sm mx-auto">
              Enter an image ID to view it. Optionally include the password to unlock the original.
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Image ID
              </label>
              <input
                type="number"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="e.g. 42"
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Password{' '}
                <span className="text-gray-700 normal-case font-normal tracking-normal">
                  — optional, unlocks original
                </span>
              </label>
              <div className="relative">
                <input
                  type={showInputPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Enter password..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                />
                <button
                  onClick={() => setShowInputPassword(!showInputPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showInputPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLookup}
              disabled={!inputId}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black transition-colors"
            >
              <Search size={16} /> View Image
            </button>
          </div>

        </motion.div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     LOADING STATE
  ══════════════════════════════════════ */
  if (loadingImage) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
      </div>
    );
  }

  /* ══════════════════════════════════════
     ERROR STATE
  ══════════════════════════════════════ */
  if (imageError) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white px-4">
        <motion.div variants={scaleIn} initial="hidden" animate="visible"
          className="text-center bg-gray-900/40 border border-red-500/20 rounded-2xl p-12 max-w-md">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Image Not Found</h2>
          <p className="text-gray-500 mb-6">No image exists with ID <span className="font-mono text-green-400">#{id}</span>.</p>
          <button
            onClick={() => navigate('/view')}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            Try Another ID
          </button>
        </motion.div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     IMAGE VIEW STATE
  ══════════════════════════════════════ */
  return (
    <div className="relative min-h-screen bg-[#080808] text-white">
      <div className="relative flex flex-col min-h-screen px-4 pt-32 pb-20" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto w-full">

          {/* ─── Header ─── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">
              Image <span className="font-mono">#{id}</span>
            </p>
            <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">
              Protected Asset
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              View the processed image below. Enter the password to retrieve the original unmodified version.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ─── LEFT: Protected Image ─── */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                      <ViperShieldIcon size={14} />
                    </div>
                    <span className="text-sm font-bold text-white">Protected Version</span>
                  </div>
                  <span className="text-xs font-mono text-gray-500">ε = {imageData?.epsilon?.toFixed(2)}</span>
                </div>

                <div className="p-4 bg-black/30">
                  <img
                    src={imageData?.image_url}
                    alt="Protected"
                    className="w-full rounded-xl object-contain max-h-[400px] bg-black/40"
                  />
                </div>

                <div className="px-5 py-4 border-t border-gray-800">
                  <button
                    onClick={() => handleDownload(imageData?.image_url, 'protected')}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-colors text-sm"
                  >
                    <Download size={16} /> Download Protected
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ─── RIGHT: Original (locked) ─── */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
              <div className={`bg-gray-900/40 border rounded-2xl overflow-hidden transition-colors duration-300 ${unlocked ? 'border-green-500/30' : 'border-gray-800'}`}>
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${unlocked ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                      {unlocked ? <Unlock size={14} /> : <Lock size={14} />}
                    </div>
                    <span className="text-sm font-bold text-white">Original Version</span>
                  </div>
                  {unlocked && <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Unlocked</span>}
                </div>

                <div className="p-4 bg-black/30 relative min-h-[200px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {unlocked && originalSrc ? (
                      <motion.img
                        key="original"
                        src={originalSrc}
                        alt="Original"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="w-full rounded-xl object-contain max-h-[400px] bg-black/40"
                      />
                    ) : (
                      <motion.div
                        key="locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 py-16 text-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-600">
                          <EyeOff size={28} strokeWidth={1.5} />
                        </div>
                        <p className="text-gray-600 text-sm font-medium">Password required to view original</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="px-5 py-4 border-t border-gray-800 space-y-3">
                  {!unlocked ? (
                    <>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                          placeholder="Enter password..."
                          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {originalError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-red-400 text-xs flex items-center gap-1.5"
                          >
                            <AlertCircle size={12} /> {originalError}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <button
                        onClick={handleUnlock}
                        disabled={!password || loadingOriginal}
                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors text-sm border border-gray-700"
                      >
                        {loadingOriginal ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Lock size={14} /> Unlock Original</>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownload(originalSrc, 'original')}
                      className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-colors text-sm"
                    >
                      <Download size={16} /> Download Original
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

          </div>

          {/* ─── Metadata row ─── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {[
              { label: 'Image ID', value: `#${id}` },
              { label: 'Epsilon',  value: imageData?.epsilon?.toFixed(2) ?? '—' },
              { label: 'Status',   value: 'Protected' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900/40 border border-gray-800 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-bold text-green-400 font-mono">{value}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </div>
  );
}