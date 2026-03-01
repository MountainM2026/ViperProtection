// src/hooks/useImageProtection.js
import { useState, useCallback, useRef } from 'react';

// Mock API function - updated to accept flags like your backend
const mockApiCall = async (file, flags, id = null) => {
  console.log(`Processing ${file.name} with flags:`, flags, `and ID:`, id || 'new');
  // Simulate different processing times
  const processingTime = flags.apply_poison ? 4000 : 1500;
  for (let i = 0; i < 100; i++) {
    await new Promise(res => setTimeout(res, processingTime / 100));
  }
  // Simulate a new ID for a new upload, or return the same ID for a chained process
  const newId = id || `viper_${Date.now()}`;
  return {
    id: newId,
    image_url: URL.createObjectURL(file), // In a real app, this would be a URL from your server
  };
};

export const useImageProtection = () => {
  const [status, setStatus] = useState('idle');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const fileInputRef = useRef(null);
  const currentIdRef = useRef(null); // Ref to hold the current asset ID

  const handleFileSelect = useCallback((selectedFile, id = null) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFile(selectedFile);
        setPreviewUrl(e.target.result);
        setStatus('idle'); // Reset to idle to allow re-processing
        setResult(null); // Clear previous result
        setError(null);
        currentIdRef.current = id; // Store the ID for the next operation
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setResult(null);
    setError(null);
    currentIdRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  // --- FIX: Updated to handle flags ---
  const handleProtect = async (flags) => {
    if (!file) return;
    setStatus('processing');
    setError(null);
    setLoadingText('Initializing...');

    try {
      // Pass the current ID and the flags object to the API call
      const processedResult = await mockApiCall(file, flags, currentIdRef.current);
      setResult(processedResult);
      // Update the ref with the (potentially new) ID from the result
      currentIdRef.current = processedResult.id;
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return {
    status, file, previewUrl, result, error, loadingText,
    fileInputRef, handleFileSelect, handleRemove, handleProtect,
    currentId: currentIdRef.current // Expose the current ID
  };
};
