import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Mic, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import type { AnalysisResponse } from '../types/analysis';

interface InputAudioPageProps {
  onAnalyze: (file: File | null, result: AnalysisResponse) => void;
}

const DEFAULT_API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8000`;
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const normalizeApiBaseUrl = (value: string | undefined): string => {
  if (value === undefined) {
    return DEFAULT_API_BASE_URL;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://') || trimmedValue.startsWith('/')) {
    return trimmedValue.replace(/\/+$/, '');
  }

  return `https://${trimmedValue.replace(/\/+$/, '')}`;
};

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);
const ALLOWED_EXTENSIONS = new Set(['wav', 'mp3', 'm4a']);
const ALLOWED_MIME_TYPES = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
]);

const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

export default function InputAudioPage({ onAnalyze }: InputAudioPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useNoiseReduction, setUseNoiseReduction] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const getFileExtension = (fileName: string): string => {
    const normalizedName = fileName.toLowerCase();
    const lastDotIndex = normalizedName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return normalizedName.slice(lastDotIndex + 1);
  };

  const isAllowedAudioFile = (selectedFile: File): boolean => {
    const mimeType = selectedFile.type.toLowerCase();
    const ext = getFileExtension(selectedFile.name);

    if (mimeType.startsWith('audio/')) return true;
    if (ALLOWED_MIME_TYPES.has(mimeType)) return true;
    if ((mimeType === '' || mimeType === 'application/octet-stream') && ALLOWED_EXTENSIONS.has(ext)) {
      return true;
    }
    return ALLOWED_EXTENSIONS.has(ext);
  };

  const validateAndSetFile = (selectedFile: File) => {
    console.debug('Upload file metadata:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      userAgent: navigator.userAgent,
    });

    if (isAllowedAudioFile(selectedFile)) {
      setFile(selectedFile);
      setErrorMessage('');
    } else {
      alert('Mohon unggah file audio (.wav, .mp3, atau .m4a)');
    }
  };

  const handleAnalyzeClick = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('use_noise_reduction', String(useNoiseReduction));
      
      const response = await fetch(buildApiUrl('/api/analyze'), {
        method: 'POST',
        body: formData,
      });

      const rawBody = await response.text();
      let payload: unknown = null;
      if (rawBody.trim()) {
        try {
          payload = JSON.parse(rawBody) as unknown;
        } catch {
          payload = rawBody.trim();
        }
      }

      if (!response.ok) {
        const detail = typeof payload === 'object' && payload && 'detail' in payload
          ? String((payload as { detail: unknown }).detail)
          : typeof payload === 'string' && payload
            ? `HTTP ${response.status}: ${payload}`
            : `HTTP ${response.status}: ${response.statusText || 'Gagal menganalisis audio'}`;
        throw new Error(detail);
      }
      
      if (!payload || typeof payload !== 'object') {
        throw new Error('Respons backend tidak valid.');
      }

      const result = payload as AnalysisResponse;
      onAnalyze(file, result);
      
    } catch (error) {
      console.error("Error analyzing audio:", error);
      if (error instanceof TypeError) {
        const target = API_BASE_URL || window.location.origin;
        setErrorMessage(`Tidak bisa terhubung ke backend (${target}). Pastikan backend aktif dan alamat API benar.`);
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat menganalisis audio.');
      }
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-8rem)] px-4 sm:px-6 py-8 sm:py-10"
    >
      <div className="max-w-2xl mx-auto w-full text-center space-y-6 sm:space-y-8 pt-4 sm:pt-6 min-h-[calc(100vh-12rem)] flex flex-col justify-center">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-serif text-ink">Unggah Suara Anda</h1>
          <p className="text-base sm:text-lg text-ink-light">
            Area khusus untuk merekam atau mengunggah suara dengan fokus penuh.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div 
          className={`relative w-full h-72 sm:h-80 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden
            ${isDragging ? 'border-terracotta bg-terracotta/5' : 'border-calm-blue/50 bg-white hover:border-calm-blue hover:bg-calm-blue/5'}
            ${file ? 'border-sage bg-sage/5' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".wav,.mp3,.m4a,audio/*,audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/x-m4a" 
            className="hidden" 
          />
          
          {file ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-sage-dark space-y-4"
            >
              <div className="p-4 bg-sage/20 rounded-full">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg text-ink">{file.name}</p>
                <p className="text-sm text-ink-light mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-sm text-terracotta hover:underline mt-2"
              >
                Ganti file
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-calm-blue-dark space-y-6 pointer-events-none">
              <div className="flex gap-6">
                <div className="p-5 bg-cream-dark rounded-full shadow-sm">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <div className="p-5 bg-cream-dark rounded-full shadow-sm">
                  <Mic className="w-10 h-10" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-xl text-ink">Tarik & lepas file audio di sini</p>
                <p className="text-ink-light">atau klik untuk memilih file</p>
              </div>
              <p className="text-sm font-medium text-terracotta bg-terracotta/10 px-4 py-2 rounded-full">
                Unggah file audio suara manusia (.wav/.mp3/.m4a) berdurasi 3-30 detik
              </p>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-ink-light bg-cream-dark py-3 px-4 sm:px-6 rounded-full inline-flex mx-auto">
          <Lock className="w-4 h-4 text-sage-dark" />
          <span>Privasi terjaga. Rekaman suara Anda diproses secara aman untuk analisis.</span>
        </div>

        <label className="flex items-center justify-center gap-3 text-sm text-ink-light">
          <input
            type="checkbox"
            className="w-4 h-4 accent-terracotta"
            checked={useNoiseReduction}
            onChange={(e) => setUseNoiseReduction(e.target.checked)}
          />
          <span>Aktifkan noise reduction (bandpass + noisereduce)</span>
        </label>

        {/* Process Button */}
        <motion.button
          whileHover={file && !isProcessing ? { scale: 1.02 } : {}}
          whileTap={file && !isProcessing ? { scale: 0.98 } : {}}
          onClick={handleAnalyzeClick}
          disabled={!file || isProcessing}
          className={`w-full max-w-md mx-auto py-4 rounded-full font-medium text-lg shadow-sm transition-all duration-300 flex items-center justify-center
            ${file 
              ? 'bg-terracotta hover:bg-terracotta-dark text-white shadow-md' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              Memproses Analisis...
            </>
          ) : (
            'Analisis Sekarang'
          )}
        </motion.button>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    </motion.div>
  );
}
