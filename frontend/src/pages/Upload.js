import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Check, 
  X, 
  Image as ImageIcon,
  PenTool,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Save,
  Palette,
  Settings,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';
import ViperShieldIcon from '../components/ViperShieldIcon';

/* ─── Animation variants ─────────────────────────────────────────── */

const fadeUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] } },
  exit:    { opacity: 0, y: -24, transition: { duration: 0.3, ease: 'easeIn' } }
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1,   transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] } },
  exit:    { opacity: 0, scale: 0.94, transition: { duration: 0.25, ease: 'easeIn' } },
};

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function Upload() {
  // Main upload states
  const [dragOver, setDragOver] = useState(false);
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("Uploading image...");
  
  // Settings States
  const [epsilon, setEpsilon] = useState(2); // 1 = Low, 2 = Medium, 3 = High
  const [processMode, setProcessMode] = useState("Viper Poison"); 
  
  // State to hold the final backend response data
  const [resultData, setResultData] = useState(null); 
  
  // NEW: State for the "Copy Link" checkmark animation
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Watermark tool states
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkLayer, setWatermarkLayer] = useState(null);
  const [color, setColor] = useState('#10b981'); 
  const [brushSize, setBrushSize] = useState(10);
  const [isEraser, setIsEraser] = useState(false);
  
  // Canvas refs and history
  const bgImageRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  /* ─── Loading Text Cycler ─── */
  useEffect(() => {
    let interval;
    if (isProcessing) {
      const isPoison = processMode.includes("Poison");
      const phrases = isPoison ? [
        "Uploading image...",
        "Analyzing pixel data...",
        "Applying Viper AI poisoning...",
        "Merging watermark layer...",
        "Finalizing security protocols...",
        "Almost done..."
      ] : [
        "Uploading image...",
        `Applying ${processMode} filter...`,
        "Rendering changes...",
        "Saving final asset...",
        "Almost done..."
      ];
      
      let step = 0;
      interval = setInterval(() => {
        step = (step + 1) % phrases.length;
        if (step === phrases.length - 1) {
          clearInterval(interval);
        }
        setLoadingText(phrases[step]);
      }, 2000); 
    } else {
      setLoadingText("Uploading image..."); 
    }
    return () => clearInterval(interval);
  }, [isProcessing, processMode]);

  /* ─── File Handling ─── */

  const acceptFile = useCallback((incoming) => {
    if (!incoming) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(incoming.type)) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(incoming);
    setPreview(URL.createObjectURL(incoming));
    setWatermarkLayer(null);
    setResultData(null); 
  }, [preview]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => acceptFile(e.target.files[0]);

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setWatermarkLayer(null);
    setResultData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ─── Combine & API Logic ─── */

  const generateCombinedImageBlob = () => {
    return new Promise((resolve, reject) => {
      if (!preview) return reject("No image to process");

      const compCanvas = document.createElement('canvas');
      const ctx = compCanvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        compCanvas.width = img.naturalWidth;
        compCanvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        if (watermarkLayer) {
          const wmImg = new Image();
          wmImg.onload = () => {
            ctx.drawImage(wmImg, 0, 0);
            compCanvas.toBlob((blob) => resolve(blob), 'image/png');
          };
          wmImg.onerror = reject;
          wmImg.src = watermarkLayer;
        } else {
          compCanvas.toBlob((blob) => resolve(blob), 'image/png');
        }
      };
      img.onerror = reject;
      img.src = preview;
    });
  };

//   const handleProtect = async () => {
//     try {
//       setIsProcessing(true);

//       const combinedBlob = await generateCombinedImageBlob();
//       const finalCombinedFile = new File(
//         [combinedBlob],
//         file?.name ? file.name.replace(/\.[^/.]+$/, ".png") : 'final-image.png',
//         { type: 'image/png' }
//       );

//       const formData = new FormData();
//       formData.append("file", finalCombinedFile);
//       formData.append("epsilon", epsilon);
//       formData.append("mode", processMode);

//       // MOCK API CALL
//       const data = await new Promise((resolve) => {
//         setTimeout(() => {
//           resolve({
//             id: Math.floor(Math.random() * 1000),
//             image_url: URL.createObjectURL(combinedBlob)
//           });
//         }, 8000);
//       });

//       console.log("Success! Backend responded with:", data);
//       setResultData(data);

//     } catch (error) {
//       console.error("Error preparing or sending image:", error);
//       alert("Failed to process image.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

  const handleProtect = async () => {
    try {
      setIsProcessing(true);

      // 1. Prepare the image file from the canvas
      const combinedBlob = await generateCombinedImageBlob();
      const finalCombinedFile = new File(
        [combinedBlob],
        file?.name ? file.name.replace(/\.[^/.]+$/, ".png") : 'protected-asset.png',
        { type: 'image/png' }
      );

      /* ─── REAL BACKEND (DIGITAL OCEAN) — ENABLED ─────────── */
      const BASE_URL = "https://viperprotection-rqhys.ondigitalocean.app/";

      const formData = new FormData();
      formData.append("file", finalCombinedFile);

      const epsilonMap = { 1: 'low', 2: 'medium', 3: 'high' };
      const modeFlags = {
        'Viper Poison':    'apply_poison=true',
        'Viper Watermark': 'apply_watermark=true',
        'Blur':            'apply_blur=true',
        'Pixelate':        'apply_pixelate=true',
      };

      const flags = modeFlags[processMode] || '';
      const url = `${BASE_URL}/images/upload?${flags}&epsilon=${epsilonMap[epsilon]}`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      console.log("Cloud Upload Success:", data);
      setResultData(data);
      navigate(`/upload?id=${data.id}`, { replace: true });
      /* ─── END REAL BACKEND ─────────────────────────────────── */


      /* ─── MOCK BACKEND (DISABLED) ────────────────────────────
      const mockData = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 999,
            image_url: URL.createObjectURL(combinedBlob)
          });
        }, 3000);
      });
      setResultData(mockData);
      ─── END MOCK ────────────────────────────────────────── */

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  };
  /* ─── Post-Processing Actions ─── */

  const handleDownload = () => {
    const src = resultData?.image_url || preview;
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = resultData ? 'viper-protected.png' : 'viper-unprotected.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link to clipboard.");
    }
  };

  /* ─── Watermark Canvas Logic ─── */

  const openWatermarkMode = () => {
    setIsWatermarking(true);
    setHistory([]);
    setHistoryStep(-1);
  };

  const closeWatermarkMode = () => setIsWatermarking(false);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const img = bgImageRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    if (watermarkLayer) {
      const existingWm = new Image();
      existingWm.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(existingWm, 0, 0);
        saveHistoryState(canvas); 
      };
      existingWm.src = watermarkLayer;
    } else {
      saveHistoryState(canvas);
    }
  };

  const saveHistoryState = (canvas) => {
    const data = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const loadHistoryState = (step) => {
    if (step < 0 || step >= history.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(step);
    };
    img.src = history[step];
  };

  const handleUndo = () => loadHistoryState(historyStep - 1);
  const handleRedo = () => loadHistoryState(historyStep + 1);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistoryState(canvas);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e.nativeEvent || e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e.nativeEvent || e);
    ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState(canvasRef.current);
    }
  };

  const saveWatermark = () => {
    const drawCanvas = canvasRef.current;
    if (!drawCanvas) return;
    setWatermarkLayer(drawCanvas.toDataURL());
    closeWatermarkMode();
  };

  const isLocked = isProcessing || !!resultData;

  return (
    <div className="h-screen overflow-hidden bg-[#080808] text-white">

      <div className="h-full flex flex-col px-4 pt-28 pb-10" style={{ zIndex: 1 }}>

        {/* Increased gap from gap-4 to gap-10 to give the title breathing room */}
        <div className="flex-1 min-h-0 max-w-5xl mx-auto w-full flex flex-col gap-10">

          {/* Header — full width above the card+panel row */}
          <motion.div className={`shrink-0 ${isProcessing || resultData ? 'text-center' : 'text-center lg:text-left'}`} variants={fadeUp} initial="hidden" animate="visible">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-1.5">
              {isProcessing ? "Processing" : resultData ? "Step 2 of 2" : "Step 1 of 2"}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 leading-tight">
              {isProcessing ? "Securing Asset" : resultData ? "Image Protected" : "Upload Your Image"}
            </h1>
            <p className={`text-gray-400 text-base ${isProcessing || resultData ? 'mx-auto' : 'max-w-xl'}`}>
              {isProcessing
                ? "Please wait while our backend scrambles your image's pixel data."
                : resultData
                  ? "Your artwork is now secure and ready to be shared."
                  : "Drop your artwork below. We'll apply invisible AI protection in seconds."}
            </p>
          </motion.div>

          {/* Content row: state card + settings panel (both start at same level) */}
          <div className="flex-1 min-h-0 flex gap-8 justify-center">

            {/* ─── STATE CARD ─── */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center">
            <AnimatePresence mode="wait">
              
              {isProcessing ? (

                /* STATE 1: PROCESSING SCREEN */
                <motion.div
                  key="processing"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full max-w-2xl mx-auto bg-gray-900/40 border border-green-500/30 rounded-2xl py-16 flex flex-col items-center justify-center text-center shadow-2xl"
                >
                  <div className="w-16 h-16 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                  <motion.h3
                    key={loadingText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold text-white tracking-wide"
                  >
                    {loadingText}
                  </motion.h3>
                </motion.div>

              ) : resultData ? (

                /* STATE 2: SUCCESS SCREEN */
                <motion.div
                  key="success"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  // Added max-w-3xl so it doesn't stretch weirdly across the whole screen
                  // Increased padding and gap to let elements breathe
                  className="w-full max-w-3xl mx-auto bg-gray-900/40 border border-green-500/30 rounded-2xl p-8 sm:p-12 flex flex-col gap-8 shadow-2xl items-center"
                >
                  {/* Compact success header */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/15 text-green-400 rounded-full flex items-center justify-center shrink-0">
                      <Check size={18} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-bold text-white">Processing Complete</span>
                  </div>

                  {/* Image — No longer a rigid square, adapts to image aspect ratio */}
                  <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden border border-gray-700 bg-black/50 p-2 flex items-center justify-center">
                    <img
                      src={resultData.image_url}
                      alt="Protected Final"
                      className="w-full max-h-[300px] object-contain rounded-lg"
                    />
                  </div>

                  {/* Action buttons — Added spacing between them (gap-5) */}
                  <div className="w-full max-w-xl flex flex-col sm:flex-row gap-5">
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-colors"
                    >
                      <Download size={18} /> Download
                    </button>

                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors hover:border-white/40 ${
                        copied
                          ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] border-green-400/50'
                          : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent'
                      }`}
                    >
                      <motion.div
                        animate={{ scale: copied ? [1, 1.25, 1] : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        {copied ? <Check size={18} /> : <Share2 size={18} />}
                      </motion.div>
                      <motion.span>
                        {copied ? 'Copied!' : 'Copy Link'}
                      </motion.span>
                    </motion.button>

                    <button
                      onClick={handleRemove}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition-colors text-gray-300"
                    >
                      <RefreshCw size={18} /> Process Another
                    </button>
                  </div>
                </motion.div>

              ) : (

                /* STATE 3: DEFAULT UPLOAD SCREEN */
                <motion.div key="upload" variants={fadeUp} initial="hidden" animate="visible" exit="exit" style={{ flex: 1 }} className="min-h-0 w-full flex flex-col gap-3">

                  <div
                    onClick={() => !preview && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex-1 min-h-0 relative rounded-2xl border-2 border-dashed transition-all duration-300
                      ${dragOver ? 'border-green-400 bg-green-500/5 cursor-copy' : preview ? 'border-green-500/40 bg-gray-900/50 cursor-default' : 'border-gray-700 hover:border-gray-500 bg-gray-900/30 hover:bg-gray-900/50 cursor-pointer'}`}
                  >
                    <AnimatePresence mode="wait">
                      {preview ? (
                        <motion.div key="preview" variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="h-full">
                          <div className="relative h-full">
                            <img src={preview} alt="Upload preview" className="w-full h-full object-contain rounded-2xl" />
                            {watermarkLayer && <img src={watermarkLayer} alt="Watermark Overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-2xl" />}
                            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 45%)' }} />
                            <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                                  <ImageIcon size={15} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{file?.name}</p>
                                  <p className="text-xs text-gray-400">{formatBytes(file?.size ?? 0)}</p>
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-150">
                                <X size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="empty" variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                          <motion.div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${dragOver ? 'bg-green-500/20 text-green-400' : 'bg-gray-800/80 text-gray-500'}`} animate={dragOver ? { scale: 1.1 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                            <UploadCloud size={36} strokeWidth={1.5} />
                          </motion.div>
                          <p className="text-xl font-semibold text-gray-200 mb-1">{dragOver ? 'Release to upload' : 'Drop your image here'}</p>
                          <p className="text-gray-500 text-sm mb-5">or click to browse files</p>
                          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-800/60 border border-gray-700/50 text-gray-500 text-xs font-medium">
                            <span>PNG</span><span className="text-gray-700">·</span><span>JPG</span><span className="text-gray-700">·</span><span>WebP</span><span className="text-gray-700">·</span><span>Up to 50 MB</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />

                  {/* Buttons inside Upload State */}
                  <AnimatePresence>
                    {file && (
                      <motion.div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}>
                        <button onClick={openWatermarkMode} className="w-full py-3 rounded-xl font-bold border-2 border-gray-700 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-3 text-gray-200">
                          <PenTool size={18} />
                          {watermarkLayer ? 'Custom Watermark' : 'Watermark'}
                        </button>

                        <button onClick={handleProtect} className="relative w-full py-3 rounded-xl font-bold overflow-hidden flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-black shadow-green-glow hover:shadow-green-glow-lg hover:-translate-y-0.5 transition-all duration-200">
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                          <ViperShieldIcon size={20} />
                          {processMode === "Viper Poison" ? "Process Image" : `Apply ${processMode}`}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trust pills inside Upload State */}
                  <motion.div className="shrink-0 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-1" variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
                    {['Images never stored', 'End-to-end secure', 'Free forever'].map((label) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="text-green-500/60"><Check size={11} strokeWidth={2.5} /></span>{label}
                      </div>
                    ))}
                  </motion.div>

                </motion.div>

              )}
            </AnimatePresence>
            </div>

          {/* ─── SETTINGS PANEL ─── */}
          <motion.div
            className="hidden lg:block shrink-0 overflow-hidden self-start"
            initial={{ width: 320, opacity: 1 }}
            animate={{
              width: isProcessing || resultData ? 0 : 320,
              opacity: isProcessing || resultData ? 0 : 1,
            }}
            transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ pointerEvents: isProcessing || resultData ? 'none' : 'auto' }}
          >
            <div className="w-[320px]">
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">

              <div className="flex items-center gap-2 mb-1.5">
                <Settings size={18} className="text-gray-400" />
                <h3 className="text-lg font-bold text-white">Protection</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Configure settings before processing.</p>

              <div className="space-y-3">

                {/* ─── EPSILON SLIDER ─── */}
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Epsilon Value</label>
                  <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${
                    epsilon === 1 ? 'text-green-400 bg-green-500/10' :
                    epsilon === 2 ? 'text-yellow-400 bg-yellow-500/10' :
                    'text-red-400 bg-red-500/10'
                  }`}>
                    {epsilon === 1 ? 'LOW' : epsilon === 2 ? 'MEDIUM' : 'HIGH'}
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={epsilon}
                  onChange={(e) => setEpsilon(parseInt(e.target.value))}
                  disabled={isLocked}
                  className={`w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    epsilon === 1 ? 'accent-green-500' :
                    epsilon === 2 ? 'accent-yellow-500' :
                    'accent-red-500'
                  }`}
                />

                <div className="flex justify-between text-xs font-bold uppercase tracking-wider px-1">
                  <span className={epsilon === 1 ? "text-green-400" : "text-gray-500"}>Low</span>
                  <span className={epsilon === 2 ? "text-yellow-400" : "text-gray-500"}>Med</span>
                  <span className={epsilon === 3 ? "text-red-400" : "text-gray-500"}>High</span>
                </div>

                <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/50 text-xs text-gray-400 leading-relaxed">
                  {epsilon === 1 && "Minimal pixel alteration. Highest image quality, but lower resistance to sophisticated AI scraping."}
                  {epsilon === 2 && "Balanced pixel alteration. An optimal mix of visual fidelity and AI protection for most artworks."}
                  {epsilon === 3 && "Maximum pixel alteration. Highest security against AI models, but may introduce slight visible noise."}
                </div>

                <hr className="border-gray-800 my-3" />

                {/* ─── PROCESSING MODE ─── */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Viper Poison", "Viper Watermark", "Blur", "Pixelate"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setProcessMode(mode)}
                        disabled={isLocked}
                        className={`py-2.5 px-2 rounded-xl text-sm font-bold border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          processMode === mode
                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                            : "bg-gray-950/50 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-800 my-1" />

                {/* ─── DOWNLOAD + COPY LINK ─── */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleDownload}
                    disabled={!preview}
                    whileHover={preview ? { scale: 1.05, y: -2 } : {}}
                    whileTap={preview ? { scale: 0.95 } : {}}
                    animate={downloaded ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      downloaded
                        ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] border-green-400/50'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent hover:border-white/40'
                    }`}
                  >
                    <motion.div
                      animate={{ scale: downloaded ? [1, 1.25, 1] : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      {downloaded ? <Check size={18} /> : <Download size={18} />}
                    </motion.div>
                    <span>{downloaded ? 'Downloaded!' : 'Download'}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleShare}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-colors hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                      copied
                        ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] border-green-400/50'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent'
                    }`}
                  >
                    <motion.div
                      animate={{ scale: copied ? [1, 1.25, 1] : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      {copied ? <Check size={18} /> : <Share2 size={18} />}
                    </motion.div>
                    <motion.span>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </motion.span>
                  </motion.button>
                </div>

              </div>

            </div>
            </div>
          </motion.div>

          </div>{/* end content row */}
        </div>
      </div>

      {/* ── Watermark Modal Overlay ── */}
      <AnimatePresence>
        {isWatermarking && preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-xl flex flex-col sm:flex-row">
            {/* Sidebar Tools */}
            <div className="w-full sm:w-72 bg-gray-900/60 border-b sm:border-b-0 sm:border-r border-gray-800 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
              <div><h2 className="text-xl font-bold mb-1">Watermark Editor</h2><p className="text-xs text-gray-400">Draw directly on your image</p></div>
              <div className="flex gap-2 p-1 bg-gray-950 rounded-lg">
                <button onClick={() => setIsEraser(false)} className={`flex-1 py-2 rounded-md flex justify-center items-center gap-2 text-sm font-medium transition-colors ${!isEraser ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}><PenTool size={16} /> Brush</button>
                <button onClick={() => setIsEraser(true)} className={`flex-1 py-2 rounded-md flex justify-center items-center gap-2 text-sm font-medium transition-colors ${isEraser ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}><Eraser size={16} /> Eraser</button>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Palette size={14} /> Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={isEraser} className={`w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0 ${isEraser ? 'opacity-50' : ''}`} />
                  <span className="text-sm font-mono text-gray-300">{color.toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</label>
                  <span className="text-xs font-mono text-gray-500">{brushSize}px</span>
                </div>
                <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-green-500" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-auto sm:mt-4">
                <button onClick={handleUndo} disabled={historyStep <= 0} className="py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 rounded-lg flex justify-center items-center text-gray-300 transition-colors"><Undo2 size={18} /></button>
                <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 rounded-lg flex justify-center items-center text-gray-300 transition-colors"><Redo2 size={18} /></button>
                <button onClick={handleClear} className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex justify-center items-center transition-colors"><Trash2 size={18} /></button>
              </div>
              <div className="flex flex-col gap-3 mt-4 sm:mt-auto pt-6 border-t border-gray-800">
                <button onClick={saveWatermark} className="w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-colors"><Save size={18} /> Save Watermark</button>
                <button onClick={closeWatermarkMode} className="w-full py-3 rounded-lg font-semibold flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#080808_100%)]">
              <div className="relative inline-block max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-gray-800">
                <img ref={bgImageRef} src={preview} alt="Artwork to watermark" onLoad={initCanvas} className="max-w-full max-h-[80vh] object-contain block pointer-events-none select-none" />
                <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} onTouchCancel={stopDrawing} className="absolute inset-0 w-full h-full cursor-crosshair touch-none" style={{ touchAction: 'none' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}