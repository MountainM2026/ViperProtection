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
  { icon: <EyeOff size={20} />,              title: 'Invisible to Humans',  desc: 'Your audience sees exactly what you created' },
  { icon: <Zap size={20} />,                 title: 'Lethal to AI',         desc: 'Forces models to learn corrupted patterns' },
  { icon: <ImageIcon size={20} />,           title: 'Zero Quality Loss',    desc: 'The protection survives compression and resizing' },
  { icon: <ViperShieldIcon size={20} />,     title: 'One-Click Simple',     desc: 'No settings, no technical knowledge' },
  { icon: <LayoutGrid size={20} />,          title: 'All Formats',          desc: 'JPG, PNG, WebP, TIFF at any resolution' },
  { icon: <Lock size={20} />, title: 'Zero AI Training', desc: 'We guarantee your uploads will never be used to train models' }];

const STEPS = [
  { step: '1', title: 'Upload Your Image',   icon: <UploadCloud size={32} strokeWidth={1.5} />, desc: 'Drag & drop any artwork, photo, or illustration. We support JPG, PNG, and WebP at any resolution' },
  { step: '2', title: 'We Apply the Venom',  icon: <ViperShieldIcon size={32} />,               desc: 'Our algorithm injects imperceptible noise that corrupts AI training' },
  { step: '3', title: 'Download & Share',    icon: <Download size={32} strokeWidth={1.5} />,    desc: 'Grab your protected image. Visually identical but any AI that trains on it learns garbage' },
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
      <div style={{
  position: 'fixed',
  top: 0,
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  opacity: 0,
  pointerEvents: 'none'
}}>
  <a href="http://localhost:8000/" tabIndex="-1">Free Art Dataset Download</a>
  <a href="http://localhost:8000/?type=training" tabIndex="-1">AI Training Images</a>
  <a href="http://localhost:8000/?license=public-domain" tabIndex="-1">Public Domain Artwork</a>
</div>

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden" style={{ zIndex: 1 }}>
        <img src="/ViperBackground.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none select-none" />
        <div className="absolute inset-0 bg-[#080808]/60 pointer-events-none" />

        {/* ── Hero content ── */}
        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.13 } } }}
        >

          <motion.h1 variants={fadeUp}
            className="text-6xl sm:text-7xl md:text-[88px] font-black leading-[1.04]
                       tracking-tight mb-8">
            <span className="block text-white drop-shadow-sm">Viper</span>
            <span className="block text-gradient-green">Protect</span>
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto
                       mb-12 leading-relaxed font-light">
            We add an invisible layer of protection to your images that scrambles AI training models.
            Your work looks exactly the same to human eyes, but becomes completely unusable to AI scrapers.
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
              Protect Your Art
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
            Free forever &nbsp;·&nbsp; No account required &nbsp;·&nbsp; Processed securely
          </motion.p>
        </motion.div>

      </section>


      {/* ════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">

          <motion.div
            className="mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">How It Works</h2>
          </motion.div>

          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {STEPS.map(({ step, title, desc, icon }, i) => (
              <motion.div key={i} variants={staggerItem}
                className="group flex items-start gap-6 sm:gap-10 py-10 border-t border-gray-800
                           hover:border-green-500/30 transition-colors duration-300">

                {/* Oversized step number */}
                <div className="shrink-0 font-mono font-black leading-none select-none
                                text-[5rem] sm:text-[7rem] w-24 sm:w-36 text-right
                                text-gray-800 group-hover:text-green-500/20 transition-colors duration-300">
                  {step}
                </div>

                {/* Content */}
                <div className="flex-1 pt-3 sm:pt-5">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-3
                                 group-hover:text-green-400 transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-md">{desc}</p>
                </div>

                {/* Icon */}
                <div className="hidden sm:block shrink-0 pt-5 text-gray-700
                                group-hover:text-green-500/50 transition-colors duration-300">
                  {icon}
                </div>

              </motion.div>
            ))}
            {/* Bottom border */}
            <div className="border-t border-gray-800" />
          </motion.div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 relative" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Built for Artists</h2>
          </motion.div>

          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="grid sm:grid-cols-2 gap-0"
          >
            {FEATURES.map(({ icon, title, desc }, i) => (
              <motion.div key={i} variants={staggerItem}
                className="group flex items-start gap-4 py-6 px-2
                           border-t border-gray-800 hover:border-green-500/20
                           transition-colors duration-300
                           sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-gray-800 sm:[&:nth-child(odd)]:pr-8 sm:[&:nth-child(even)]:pl-8">

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black uppercase tracking-tight text-white text-sm mb-1
                                 group-hover:text-green-400 transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-500 transition-colors duration-300">
                    {desc}
                  </p>
                </div>

                {/* Icon */}
                <div className="shrink-0 text-gray-800 group-hover:text-green-500/40
                                transition-colors duration-300 mt-0.5">
                  {icon}
                </div>

              </motion.div>
            ))}
            <div className="border-t border-gray-800 sm:col-span-2" />
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
              Drop your artwork below
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
            <span className="text-gradient-green">YOURS</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join artists who refuse to let their work fuel AI they never consented to
          </p>
          <a href="#upload"
             className="group inline-flex items-center gap-2 px-10 py-4
                        bg-green-500 hover:bg-green-400 text-black font-bold
                        text-lg rounded-xl transition-all duration-200
                        shadow-green-glow hover:shadow-green-glow-lg hover:-translate-y-0.5">
            Protect Your Art Now
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
          <p className="text-gray-600 text-sm text-center">Protecting Artists like You</p>
          <p className="text-gray-700 text-sm">© 2026 ViperProtection</p>
        </div>
      </motion.footer>

    </div>
  );
}
