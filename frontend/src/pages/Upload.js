import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Download, Share2, Check, RefreshCw, Settings, PenTool, DownloadCloud, AlertCircle, ImageIcon, Undo2, Redo2, Trash2, Save, Eraser, Palette, Shield, Lock, Unlock } from 'lucide-react';

const ViperShieldIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L4 7V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
};

const loadingMessages = [
  "Initializing protection...",
  "Scrambling pixel data...",
  "Applying AI shield...",
  "Finalizing security...",
  "Almost done..."
];

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const bgImageRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Core states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Watermarking states
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkLayer, setWatermarkLayer] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Settings states
  const [epsilon, setEpsilon] = useState(2);
  const [processMode, setProcessMode] = useState('Viper Poison');

  // Generate combined image blob with watermark
  const generateCombinedImageBlob = useCallback(async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const originalImage = new Image();
    originalImage.src = preview;
    await new Promise((resolve) => { originalImage.onload = resolve; });

    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;

    ctx.drawImage(originalImage, 0, 0);

    if (watermarkLayer) {
      const watermarkImage = new Image();
      watermarkImage.src = watermarkLayer;
      await new Promise((resolve) => { watermarkImage.onload = resolve; });
      ctx.drawImage(watermarkImage, 0, 0);
    }

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }, [preview, watermarkLayer]);

  // Handle fetching result from a shared link
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    if (id && !resultData && !isProcessing && !file) {
      const fetchResult = async () => {
        setIsProcessing(true);
        try {
          const response = await fetch(`https://viperprotection-rqhys.ondigitalocean.app/images/${id}`);
          if (!response.ok) throw new Error('Failed to fetch result.');
          const data = await response.json();
          setResultData(data);
        } catch (err) {
          setError(err.message || 'Could not load the protected image.');
        } finally {
          setIsProcessing(false);
        }
      };
      fetchResult();
    }
  }, [window.location.search]);

  useEffect(() => { setError(null); }, [file]);

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setLoadingText(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        return loadingMessages[(currentIndex + 1) % loadingMessages.length];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [showPasswordModal]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setResultData(null);
    setWatermarkLayer(null);
    setError(null);
    navigate('/upload', { replace: true });
  };

  const handleProtectClick = () => {
    setPasswordInput('');
    setShowPasswordModal(true);
  };

  const handleProtect = async (password) => {
    setShowPasswordModal(false);
    try {
      setIsProcessing(true);
      setError(null);

      const combinedBlob = await generateCombinedImageBlob();
      const finalCombinedFile = new File(
        [combinedBlob],
        file?.name ? file.name.replace(/\.[^/.]+$/, ".png") : 'protected-asset.png',
        { type: 'image/png' }
      );

      const BASE_URL = "https://viperprotection-rqhys.ondigitalocean.app";
      const formData = new FormData();
      formData.append("file", finalCombinedFile);

      const epsilonMap = { 1: 'low', 2: 'medium', 3: 'high' };
      let queryParams = new URLSearchParams();
      queryParams.append('epsilon', epsilonMap[epsilon]);
      queryParams.append('password', password); // empty string if user left it blank

      switch (processMode) {
        case 'Viper Poison':
          queryParams.append('apply_poison', 'true');
          break;
        case 'Viper Watermark':
          queryParams.append('apply_watermark', 'true');
          break;
        case 'Blur':
          queryParams.append('apply_blur', 'true');
          break;
        case 'Pixelate':
          queryParams.append('apply_pixelate', 'true');
          break;
      }

      const url = `${BASE_URL}/images/upload?${queryParams.toString()}`;
      const response = await fetch(url, { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResultData(data);
      navigate(`/upload?id=${data.id}`, { replace: true });

    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (watermarkLayer && !resultData) {
        const combinedBlob = await generateCombinedImageBlob();
        const url = URL.createObjectURL(combinedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file?.name ? file.name.replace(/\.[^/.]+$/, ".png") : 'watermarked-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const src = resultData?.image_url || preview;
        if (!src) return;
        const link = document.createElement('a');
        link.href = src;
        link.download = resultData ? 'viper-protected.png' : 'viper-unprotected.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download image.");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/view/${resultData?.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy link.");
    }
  };

  const openWatermarkMode = () => { setIsWatermarking(true); setHistory([]); setHistoryStep(-1); };
  const closeWatermarkMode = () => setIsWatermarking(false);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const img = bgImageRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    if (watermarkLayer) {
      const existingWm = new Image();
      existingWm.onload = () => { const ctx = canvas.getContext('2d'); ctx.drawImage(existingWm, 0, 0); saveHistoryState(canvas); };
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
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); setHistoryStep(step); };
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
    if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
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
    if (isDrawing) { setIsDrawing(false); saveHistoryState(canvasRef.current); }
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
        <div className="flex-1 min-h-0 max-w-5xl mx-auto w-full flex flex-col gap-10">
          {/* Header */}
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

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Row */}
          <div className="flex-1 min-h-0 flex gap-8 justify-center">
            {/* State Card */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div key="processing" variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="w-full max-w-2xl mx-auto bg-gray-900/40 border border-green-500/30 rounded-2xl py-16 flex flex-col items-center justify-center text-center shadow-2xl">
                    <div className="w-16 h-16 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    <motion.h3 key={loadingText} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-white tracking-wide">{loadingText}</motion.h3>
                  </motion.div>
                ) : resultData ? (
                  <motion.div key="success" variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="w-full max-w-4xl mx-auto bg-gray-900/40 border border-green-500/30 rounded-2xl p-8 sm:p-10 flex flex-col gap-8 shadow-2xl items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/15 text-green-400 rounded-full flex items-center justify-center shrink-0"><Check size={18} strokeWidth={3} /></div>
                      <span className="text-lg font-bold text-white">Processing Complete</span>
                    </div>
                    {resultData.ai_view_original && resultData.ai_view_poisoned ? (
                      <div className="w-full grid grid-cols-2 gap-4">
                        {[
                          { label: "Original", src: `data:image/png;base64,${resultData.original_image}`, accent: "border-gray-600 text-gray-300" },
                          { label: "Poisoned", src: resultData.image_url, accent: "border-green-500/50 text-green-400" },
                          { label: "AI View — Original", src: `data:image/png;base64,${resultData.ai_view_original}`, accent: "border-blue-500/40 text-blue-400" },
                          { label: "AI View — Poisoned", src: `data:image/png;base64,${resultData.ai_view_poisoned}`, accent: "border-purple-500/40 text-purple-400" },
                        ].map(({ label, src, accent }) => (
                          <div key={label} className={`flex flex-col gap-2 rounded-xl border bg-black/40 p-3 ${accent.split(' ')[0]}`}>
                            <span className={`text-xs font-bold uppercase tracking-widest ${accent.split(' ')[1]}`}>{label}</span>
                            <div className="rounded-lg overflow-hidden flex items-center justify-center bg-black/30">
                              <img src={src} alt={label} className="w-full max-h-48 object-contain rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden border border-gray-700 bg-black/50 p-2 flex items-center justify-center">
                        <img src={resultData.image_url} alt="Protected Final" className="w-full max-h-[300px] object-contain rounded-lg" />
                      </div>
                    )}
                    <div className="w-full max-w-xl flex flex-col sm:flex-row gap-5">
                      <button onClick={handleDownload} className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-colors"><Download size={18} /> Download</button>
                      <motion.button onClick={handleShare} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors hover:border-white/40 ${copied ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] border-green-400/50' : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent'}`}>
                        <motion.div animate={{ scale: copied ? [1, 1.25, 1] : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>{copied ? <Check size={18} /> : <Share2 size={18} />}</motion.div>
                        <motion.span>{copied ? 'Copied!' : 'Copy Link'}</motion.span>
                      </motion.button>
                      <button onClick={handleRemove} className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition-colors text-gray-300"><RefreshCw size={18} /> Process Another</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="upload" variants={fadeUp} initial="hidden" animate="visible" exit="exit" style={{ flex: 1 }} className="min-h-0 w-full flex flex-col gap-3">
                    <div onClick={() => !preview && fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`flex-1 min-h-0 relative rounded-2xl border-2 border-dashed transition-all duration-300 ${dragOver ? 'border-green-400 bg-green-500/5 cursor-copy' : preview ? 'border-green-500/40 bg-gray-900/50 cursor-default' : 'border-gray-700 hover:border-gray-500 bg-gray-900/30 hover:bg-gray-900/50 cursor-pointer'}`}>
                      <AnimatePresence mode="wait">
                        {preview ? (
                          <motion.div key="preview" variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="h-full">
                            <div className="relative h-full">
                              <img src={preview} alt="Upload preview" className="w-full h-full object-contain rounded-2xl" />
                              {watermarkLayer && <img src={watermarkLayer} alt="Watermark Overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-2xl" />}
                              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 45%)' }} />
                              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0"><ImageIcon size={15} /></div>
                                  <div className="min-w-0"><p className="text-sm font-semibold text-white truncate">{file?.name}</p><p className="text-xs text-gray-400">{formatBytes(file?.size ?? 0)}</p></div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-150"><X size={14} strokeWidth={2.5} /></button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="empty" variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                            <motion.div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${dragOver ? 'bg-green-500/20 text-green-400' : 'bg-gray-800/80 text-gray-500'}`} animate={dragOver ? { scale: 1.1 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}><UploadCloud size={36} strokeWidth={1.5} /></motion.div>
                            <p className="text-xl font-semibold text-gray-200 mb-1">{dragOver ? 'Release to upload' : 'Drop your image here'}</p>
                            <p className="text-gray-500 text-sm mb-5">or click to browse files</p>
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-800/60 border border-gray-700/50 text-gray-500 text-xs font-medium"><span>PNG</span><span className="text-gray-700">·</span><span>JPG</span><span className="text-gray-700">·</span><span>WebP</span><span className="text-gray-700">·</span><span>Up to 50 MB</span></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
                    <AnimatePresence>
                      {file && (
                        <motion.div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}>
                          <button onClick={openWatermarkMode} className="w-full py-3 rounded-xl font-bold border-2 border-gray-700 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-3 text-gray-200"><PenTool size={18} />{watermarkLayer ? 'Edit Watermark' : 'Add Watermark'}</button>
                          {/* Changed: onClick goes to handleProtectClick to show password modal first */}
                          <button onClick={handleProtectClick} className="relative w-full py-3 rounded-xl font-bold overflow-hidden flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-black shadow-green-glow hover:shadow-green-glow-lg hover:-translate-y-0.5 transition-all duration-200"><span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none" /><ViperShieldIcon size={20} />{processMode === "Viper Poison" ? "Process Image" : `Apply ${processMode}`}</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.div className="shrink-0 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-1" variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
                      {['Images never stored', 'End-to-end secure', 'Free forever'].map((label) => (<div key={label} className="flex items-center gap-1.5 text-xs text-gray-600"><span className="text-green-500/60"><Check size={11} strokeWidth={2.5} /></span>{label}</div>))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings Panel */}
            <motion.div className="hidden lg:block shrink-0 overflow-hidden self-start" initial={{ width: 320, opacity: 1 }} animate={{ width: isProcessing || resultData ? 0 : 320, opacity: isProcessing || resultData ? 0 : 1 }} transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }} style={{ pointerEvents: isProcessing || resultData ? 'none' : 'auto' }}>
              <div className="w-[320px]">
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-1.5"><Settings size={18} className="text-gray-400" /><h3 className="text-lg font-bold text-white">Protection</h3></div>
                  <p className="text-sm text-gray-400 mb-4">Configure settings before processing.</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Epsilon Value</label><span className={`text-xs font-bold font-mono px-2 py-1 rounded ${epsilon === 1 ? 'text-green-400 bg-green-500/10' : epsilon === 2 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'}`}>{epsilon === 1 ? 'LOW' : epsilon === 2 ? 'MEDIUM' : 'HIGH'}</span></div>
                    <input type="range" min="1" max="3" step="1" value={epsilon} onChange={(e) => setEpsilon(parseInt(e.target.value))} disabled={isLocked} className={`w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${epsilon === 1 ? 'accent-green-500' : epsilon === 2 ? 'accent-yellow-500' : 'accent-red-500'}`} />
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider px-1"><span className={epsilon === 1 ? "text-green-400" : "text-gray-500"}>Low</span><span className={epsilon === 2 ? "text-yellow-400" : "text-gray-500"}>Med</span><span className={epsilon === 3 ? "text-red-400" : "text-gray-500"}>High</span></div>
                    <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/50 text-xs text-gray-400 leading-relaxed">{epsilon === 1 && "Minimal pixel alteration. Highest image quality, but lower resistance to sophisticated AI scraping."}{epsilon === 2 && "Balanced pixel alteration. An optimal mix of visual fidelity and AI protection for most artworks."}{epsilon === 3 && "Maximum pixel alteration. Highest security against AI models, but may introduce slight visible noise."}</div>
                    <hr className="border-gray-800 my-3" />
                    <div className="space-y-2"><label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Mode</label><div className="grid grid-cols-2 gap-2">{["Viper Poison", "Viper Watermark", "Blur", "Pixelate"].map((mode) => (<button key={mode} onClick={() => setProcessMode(mode)} disabled={isLocked} className={`py-2.5 px-2 rounded-xl text-sm font-bold border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${processMode === mode ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-gray-950/50 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-300"}`}>{mode}</button>))}</div></div>
                    <hr className="border-gray-800 my-1" />
                    <div className="flex gap-2">
                      <motion.button onClick={handleDownload} disabled={!preview} whileHover={preview ? { scale: 1.05, y: -2 } : {}} whileTap={preview ? { scale: 0.95 } : {}} animate={downloaded ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${downloaded ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] border-green-400/50' : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent hover:border-white/40'}`}><motion.div animate={{ scale: downloaded ? [1, 1.25, 1] : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>{downloaded ? <Check size={18} /> : <Download size={18} />}</motion.div><span>{downloaded ? 'Downloaded!' : 'Download'}</span></motion.button>
                      <motion.button onClick={handleShare} disabled={isProcessing} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-colors hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed ${copied ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] border-green-400/50' : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent'}`}><motion.div animate={{ scale: copied ? [1, 1.25, 1] : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>{copied ? <Check size={18} /> : <Share2 size={18} />}</motion.div><motion.span>{copied ? 'Copied!' : 'Copy Link'}</motion.span></motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Password Modal ── */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                  <Lock size={16} />
                </div>
                <h2 className="text-lg font-bold text-white">Set a Password</h2>
              </div>
              <p className="text-sm text-gray-400 mb-5 pl-12">
                Optionally protect your original with a password. Leave blank to skip.
              </p>
              <input
                ref={passwordInputRef}
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProtect(passwordInput);
                  if (e.key === 'Escape') setShowPasswordModal(false);
                }}
                placeholder="Enter password (optional)"
                className="w-full bg-gray-950 border border-gray-700 focus:border-green-500/60 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProtect(passwordInput)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-400 text-black transition-colors flex items-center justify-center gap-2"
                >
                  <ViperShieldIcon size={16} />
                  {passwordInput ? 'Protect' : 'Skip & Protect'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark Modal Overlay */}
      <AnimatePresence>
        {isWatermarking && preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-xl flex flex-col sm:flex-row">
            <div className="w-full sm:w-72 bg-gray-900/60 border-b sm:border-b-0 sm:border-r border-gray-800 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
              <div><h2 className="text-xl font-bold mb-1">Watermark Editor</h2><p className="text-xs text-gray-400">Draw directly on your image</p></div>
              <div className="flex gap-2 p-1 bg-gray-950 rounded-lg"><button onClick={() => setIsEraser(false)} className={`flex-1 py-2 rounded-md flex justify-center items-center gap-2 text-sm font-medium transition-colors ${!isEraser ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}><PenTool size={16} /> Brush</button><button onClick={() => setIsEraser(true)} className={`flex-1 py-2 rounded-md flex justify-center items-center gap-2 text-sm font-medium transition-colors ${isEraser ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}><Eraser size={16} /> Eraser</button></div>
              <div className="space-y-3"><label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Palette size={14} /> Color</label><div className="flex items-center gap-3"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={isEraser} className={`w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0 ${isEraser ? 'opacity-50' : ''}`} /><span className="text-sm font-mono text-gray-300">{color.toUpperCase()}</span></div></div>
              <div className="space-y-3"><div className="flex justify-between items-center"><label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</label><span className="text-xs font-mono text-gray-500">{brushSize}px</span></div><input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-green-500" /></div>
              <div className="grid grid-cols-3 gap-2 mt-auto sm:mt-4"><button onClick={handleUndo} disabled={historyStep <= 0} className="py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 rounded-lg flex justify-center items-center text-gray-300 transition-colors"><Undo2 size={18} /></button><button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 rounded-lg flex justify-center items-center text-gray-300 transition-colors"><Redo2 size={18} /></button><button onClick={handleClear} className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex justify-center items-center transition-colors"><Trash2 size={18} /></button></div>
              <div className="flex flex-col gap-3 mt-4 sm:mt-auto pt-6 border-t border-gray-800"><button onClick={saveWatermark} className="w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-colors"><Save size={18} /> Save Watermark</button><button onClick={closeWatermarkMode} className="w-full py-3 rounded-lg font-semibold flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button></div>
            </div>
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
