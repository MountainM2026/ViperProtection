# 🐍 ViperProtection

> **Mountain Madness Hackathon 2026**

Invisible adversarial poisoning for digital art. Protect your images from AI training scrapers, without changing a single visible pixel.

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![DigitalOcean](https://img.shields.io/badge/DigitalOcean-0080FF?style=flat&logo=digitalocean&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat&logo=python&logoColor=white)

**Live Demo:** [viperproc-bgoes.ondigitalocean.app](https://viperproc-bgoes.ondigitalocean.app)

---

## Table of Contents

- [What is ViperProtection?](#what-is-viperprotection)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)

---

## What is ViperProtection?

ViperProtection is a full-stack web application built at Mountain Madness 2026 that lets artists protect their digital artwork from being used to train AI models — without any visible degradation to image quality.

Using adversarial machine learning, we inject imperceptible pixel-level perturbations ("poison") into images. These perturbations are invisible to the human eye but cause AI training pipelines to learn corrupted, useless patterns — permanently degrading any model trained on the protected image.

| Feature | Description |
|---|---|
| **Invisible to Humans** | PSNR above 40 dB — looks identical to the original |
| **Lethal to AI** | Forces models to learn corrupted weights permanently |
| **Original Secured** | Original stored as encrypted binary, password-protected |
| **Cloud-Backed** | Processed images hosted on DigitalOcean Spaces CDN |

---

## How It Works

**1. Upload Your Image**
The user uploads a PNG, JPG, or WebP image. Optionally they can draw a custom watermark layer directly on the image in the browser before processing.

**2. Original Stored Securely**
The original image is read as raw bytes and stored directly in PostgreSQL as binary data — no public URL, no cloud link. It's only accessible via password through the `/original` endpoint.

**3. Adversarial Poison Applied**
The image is temporarily uploaded to DigitalOcean Spaces to generate a URL, which is passed to the Viper Poison ML API. The poisoner applies adversarial perturbations using a VAE + CLIP pipeline and returns the poisoned image as base64.

**4. Processed Image Saved to Cloud**
The poisoned image is uploaded to DigitalOcean Spaces and a public CDN URL is returned to the frontend for display and download.

**5. Protection Metrics Returned**
The API response includes the protection score, semantic similarity score, epsilon value used, and AI-view visualizations of both the original and poisoned image — none of which are stored.

---

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- A PostgreSQL database (we used DigitalOcean Managed Database)
- A DigitalOcean Spaces bucket with CDN enabled
- The Viper Poison ML API running (ngrok tunnel or deployed server)

---

## Installation

**Clone the repo**
```bash
git clone https://github.com/MountainM2026/ViperProtection-.git
cd ViperProtection-
```

**Backend setup**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend setup**
```bash
cd frontend
npm install
```

---

## Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
DO_SPACES_KEY=your_spaces_access_key
DO_SPACES_SECRET=your_spaces_secret_key
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_REGION=tor1
DO_SPACES_ENDPOINT=https://tor1.digitaloceanspaces.com
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

> [CAUTION] Never commit your `.env` file to git. Make sure `backend/.env` is in your `.gitignore`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `DO_SPACES_KEY` | DigitalOcean Spaces access key ID |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret access key |
| `DO_SPACES_BUCKET` | Name of your Spaces bucket |
| `DO_SPACES_REGION` | Spaces region (e.g. `tor1`) |
| `DO_SPACES_ENDPOINT` | Spaces endpoint URL |
| `BACKEND_CORS_ORIGINS` | JSON array of allowed frontend origins |

---

## Running Locally

**Start the backend**
```bash
cd backend
uvicorn engine.api.main:app --reload
```
API available at `http://127.0.0.1:8000` — interactive docs at `http://127.0.0.1:8000/docs`

**Start the frontend**
```bash
cd frontend
npm start
```
React app available at `http://localhost:3000`

---

## API Reference

Base URL: `http://127.0.0.1:8000` (local) or your deployed App Platform URL.

---

### `POST /images/upload`

Upload an image and apply protection effects. Returns a CDN URL for the processed image along with optional poison metrics.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `password` | string | Password to protect original image access |
| `epsilon` | `low` \| `medium` \| `high` | Adversarial perturbation strength |
| `apply_pixelate` | boolean | Apply pixelation effect |
| `apply_blur` | boolean | Apply Gaussian blur |
| `apply_watermark` | boolean | Apply Viper watermark overlay |
| `apply_poison` | boolean | Apply adversarial AI poisoning |

**Request Body:** `multipart/form-data` with `file` field (PNG, JPG, WebP)

**Example Response**
```json
{
  "id": 42,
  "image_url": "https://bucket.tor1.cdn.digitaloceanspaces.com/abc123.png",
  "epsilon": 0.05,
  "metrics": {
    "protection_score": 94,
    "similarity": 0.98,
    "epsilon_used": 0.05
  },
  "ai_view_original": "<base64 string>",
  "ai_view_poisoned": "<base64 string>"
}
```

---

### `POST /images/{image_id}/original`

Retrieve the original unprocessed image. Requires the correct password set at upload time. Returns raw PNG bytes.

**Request Body**
```json
{ "password": "your_password" }
```

---

### `GET /images/{image_id}`

Get metadata for a single image by ID.

---

### `GET /images/`

List all uploaded images.

---

### `DELETE /images/{image_id}`

Delete an image record from the database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Tailwind CSS, Framer Motion, Lucide Icons, React Router |
| **Backend** | FastAPI, SQLAlchemy, Pydantic, bcrypt, Pillow, boto3 |
| **Database** | PostgreSQL via DigitalOcean Managed Database |
| **Storage** | DigitalOcean Spaces (S3-compatible) with CDN |
| **ML Poisoner** | Custom adversarial pipeline using VAE + CLIP tensors |
| **Deployment** | DigitalOcean App Platform |

---

*Fighting AI art theft, one image at a time. © 2026 ViperProtection*
