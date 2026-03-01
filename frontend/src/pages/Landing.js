import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UploadCloud, Download, EyeOff, Zap,
  Image as ImageIcon, Lock, LayoutGrid, Check,
} from 'lucide-react';
import ViperShieldIcon from '../components/ViperShieldIcon';

/* ─── Animation variants ─────────────────────────────────────────── */

const fadeUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
};

// Parent that staggers its children
const staggerGrid = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// Child used inside a staggerGrid parent
const staggerItem = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const VIEWPORT = { once: false, amount: 0.15 };

/* ─── Data ───────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: <EyeOff size={20} />,              title: 'Invisible to Humans',  desc: 'Perturbations are perceptually imperceptible. Your audience sees exactly what you created.' },
  { icon: <Zap size={20} />,                 title: 'Lethal to AI',         desc: 'Forces models to learn corrupted patterns — poisoning their weights and degrading outputs permanently.' },
  { icon: <ImageIcon size={20} />,           title: 'Zero Quality Loss',    desc: 'PSNR above 40 dB. Post it anywhere — the protection survives compression and resizing.' },
  { icon: <ViperShieldIcon size={20} />,     title: 'One-Click Simple',     desc: 'No settings, no technical knowledge. Upload → protect → download in under two seconds.' },
  { icon: <LayoutGrid size={20} />,          title: 'All Formats',          desc: 'JPG, PNG, WebP, TIFF — protect any image format you create, at any resolution.' },
  { icon: <Lock size={20} />,                title: 'Privacy First',        desc: 'Images are processed in-memory and never stored, logged, or shared. Your art stays yours.' },
];

const STEPS = [
  { step: '01', title: 'Upload Your Image',   icon: <UploadCloud size={32} strokeWidth={1.5} />, desc: 'Drag & drop any artwork, photo, or illustration. We support JPG, PNG, and WebP at any resolution.' },
  { step: '02', title: 'We Apply the Venom',  icon: <ViperShieldIcon size={32} />,               desc: 'Our adversarial algorithm injects imperceptible pixel-level noise that silently corrupts AI training.' },
  { step: '03', title: 'Download & Share',    icon: <Download size={32} strokeWidth={1.5} />,    desc: 'Grab your protected image. Visually identical — but any AI that trains on it learns garbage.' },
];

/* ─── Main component ─────────────────────────────────────────────── */

export default function Landing() {
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    navigate('/upload');
  };

  return (
    <div className="relative min-h-screen bg-[#080808] text-white">
      

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16" style={{ zIndex: 1 }}>

        {/* ── Hero content ── */}
        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.13 } } }}
        >
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full
                       bg-green-500/10 border border-green-500/25 text-green-400
                       text-sm font-medium mb-10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now protecting artists worldwide
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="text-6xl sm:text-7xl md:text-[88px] font-black leading-[1.04]
                       tracking-tight mb-8">
            <span className="block text-white drop-shadow-sm">Your Art.</span>
            <span className="block text-gradient-green">Untouchable.</span>
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto
                       mb-12 leading-relaxed font-light">
            Invisible to humans. Lethal to AI. We inject adversarial signals into your images
            that silently corrupt AI training — without touching a single visible pixel.
          </motion.p>

          <motion.div variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a href="#upload"
               className="group relative px-9 py-4 bg-green-500 hover:bg-green-400
                          text-black font-bold text-lg rounded-xl transition-all duration-200
                          shadow-green-glow hover:shadow-green-glow-lg hover:-translate-y-0.5
                          w-full sm:w-auto text-center overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent
                               via-white/20 to-transparent -translate-x-full
                               animate-shimmer pointer-events-none" />
              Protect My Art
              <span className="ml-2 inline-block transition-transform duration-200
                               group-hover:translate-x-1">→</span>
            </a>
            <a href="#how-it-works"
               className="px-9 py-4 border border-gray-700/80 hover:border-gray-500
                          text-gray-300 hover:text-white font-semibold text-lg
                          rounded-xl transition-all duration-200
                          w-full sm:w-auto text-center backdrop-blur-sm">
              How It Works
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-gray-600">
            Free forever &nbsp;·&nbsp; No account required &nbsp;·&nbsp; Images never stored
          </motion.p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-gray-500" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500">Scroll</span>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════ */}
      <section className="py-12 border-y border-gray-800/50 relative" style={{ zIndex: 1 }}>
        <motion.div
          className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8"
          variants={staggerGrid}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {[
            { value: '50K+',  label: 'Images Protected' },
            { value: '99.8%', label: 'Success Rate'     },
            { value: '< 2s',  label: 'Processing Time'  },
            { value: '100%',  label: 'Free to Use'      },
          ].map(({ value, label }) => (
            <motion.div key={label} variants={staggerItem} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-green-400 tabular-nums">{value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1.5 tracking-wide uppercase">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">

          <motion.div
            className="text-center mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">The Process</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-5">Three Steps to Invisible Protection</h2>
            <p className="text-gray-400 text-lg max-w-lg mx-auto">
              No technical knowledge needed. Upload and walk away protected.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5 relative"
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {/* Connector dashes */}
            <div className="hidden md:block absolute top-[52px] left-[37%] right-[37%] h-px
                            border-t border-dashed border-green-500/20 pointer-events-none" />

            {STEPS.map(({ step, title, desc, icon }, i) => (
              <motion.div key={i} variants={staggerItem}
                className="group relative p-8 rounded-2xl
                           bg-gray-900/40 border border-gray-800
                           hover:border-green-500/30 hover:bg-gray-900/60
                           transition-all duration-300">
                <div className="absolute top-5 right-6 text-7xl font-black leading-none
                                text-gray-800/60 select-none
                                group-hover:text-green-500/15 transition-colors duration-300">
                  {step}
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20
                                flex items-center justify-center text-green-400 mb-7
                                group-hover:bg-green-500/20 transition-colors duration-300">
                  {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed text-[15px]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">Why Viper</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-5">Built for Artists, By Artists</h2>
            <p className="text-gray-400 text-lg max-w-lg mx-auto">
              Everything you need to fight back against AI art theft.
            </p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {FEATURES.map(({ icon, title, desc }, i) => (
              <motion.div key={i} variants={staggerItem}
                className="group p-7 rounded-2xl
                           bg-gray-900/30 border border-gray-800/70
                           hover:border-gray-700 hover:bg-gray-900/50
                           transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20
                                flex items-center justify-center text-green-400 mb-5
                                group-hover:bg-green-500/20 group-hover:border-green-500/40
                                transition-all duration-300">
                  {icon}
                </div>
                <h3 className="font-bold mb-2 text-white">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          UPLOAD
      ════════════════════════════════════════════════════ */}
      <section id="upload" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
        <motion.div
          className="max-w-2xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <div className="text-center mb-14">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">Try It Now</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-5">Protect Your Image</h2>
            <p className="text-gray-400 text-lg">
              Drop your artwork below — protection completes in under 2 seconds.
            </p>
          </div>

          {/* Drop zone */}
          <div
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer
                        overflow-hidden transition-all duration-300
                        ${dragOver
                          ? 'border-green-400 bg-green-500/5 dropzone-active'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-900/20 hover:bg-gray-900/30'
                        }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => navigate('/upload')}
          >
            <div className="py-20 px-8 text-center">
              <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6
                               transition-all duration-300
                               ${dragOver ? 'bg-green-500/20 text-green-400 scale-110' : 'bg-gray-800/80 text-gray-500'}`}>
                <UploadCloud size={36} strokeWidth={1.5} />
              </div>
              <p className="text-xl font-semibold text-gray-300 mb-2">
                {dragOver ? 'Release to protect' : 'Drop your image here'}
              </p>
              <p className="text-gray-600 text-sm mb-8">or click to browse files</p>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full
                              bg-gray-800/60 border border-gray-700/50
                              text-gray-500 text-xs font-medium">
                JPG &nbsp;·&nbsp; PNG &nbsp;·&nbsp; WebP &nbsp;·&nbsp; Up to 50 MB
              </div>
            </div>
          </div>

          {/* Trust pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Never stored', 'Processed securely', 'Free forever'].map((label) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="text-green-500/70"><Check size={11} strokeWidth={2.5} /></span>
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════
          FINAL CTA BANNER
      ════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative" style={{ zIndex: 1 }}>
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
            Your art deserves to stay{' '}
            <span className="text-gradient-green">yours.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of artists who refuse to let their work fuel AI they never consented to.
          </p>
          <a href="#upload"
             className="group inline-flex items-center gap-2 px-10 py-4
                        bg-green-500 hover:bg-green-400 text-black font-bold
                        text-lg rounded-xl transition-all duration-200
                        shadow-green-glow hover:shadow-green-glow-lg hover:-translate-y-0.5">
            Protect My Art Now
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <motion.footer
        className="py-10 px-4 border-t border-gray-800/60 relative"
        style={{ zIndex: 1 }}
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20
                            flex items-center justify-center text-green-400">
              <ViperShieldIcon size={16} />
            </div>
            <span className="font-bold text-white tracking-tight">ViperProtection</span>
          </div>
          <p className="text-gray-600 text-sm text-center">Fighting AI art theft, one image at a time.</p>
          <p className="text-gray-700 text-sm">© 2026 ViperProtection</p>
        </div>
      </motion.footer>

    </div>
  );
}
