import { useState } from 'react';

function Landing() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProtect = () => {
    // TODO: send image to backend for poisoning
    alert('Sending image to be protected...');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center pt-32 pb-16 px-4">
        <h1 className="text-5xl font-bold mb-4">ViperProtection 🐍</h1>
        <p className="text-xl text-gray-400 max-w-xl text-center">
          Poison your images so AI models can't steal your art. Protect your creative work with one click.
        </p>
      </div>

      {/* Upload Section */}
      <div className="flex flex-col items-center px-4 pb-32">
        <div className="w-full max-w-lg bg-gray-800 rounded-xl p-8">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-green-500 transition"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-56 rounded" />
            ) : (
              <div className="text-center">
                <p className="text-2xl mb-2">📁</p>
                <p className="text-gray-400">Click to upload an image</p>
                <p className="text-gray-500 text-sm mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>

          {image && (
            <button
              onClick={handleProtect}
              className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg transition"
            >
              Protect Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Landing;