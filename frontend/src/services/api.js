// src/services/api.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://viperprotection-rqhys.ondigitalocean.app";

export const apiProtectImage = async (file, epsilon, mode) => {
  const formData = new FormData();
  formData.append("file", file);

  const epsilonMap = { 1: 'low', 2: 'medium', 3: 'high' };
  const modeFlags = {
    'Viper Poison': 'apply_poison=true',
    'Viper Watermark': 'apply_watermark=true',
    'Blur': 'apply_blur=true',
    'Pixelate': 'apply_pixelate=true',
  };

  const flags = modeFlags[mode] || '';
  const url = `${BASE_URL}/images/upload?${flags}&epsilon=${epsilonMap[epsilon]}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }

  return response.json();
};
