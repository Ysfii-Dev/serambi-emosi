import React from 'react';
import { motion } from 'motion/react';
import { Mic, Activity, BrainCircuit, HeartHandshake } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const emotions = [
    { name: 'Senang', color: 'bg-emo-senang text-green-800 border-green-200' },
    { name: 'Sedih/Kecewa', color: 'bg-emo-sedih text-blue-800 border-blue-200' },
    { name: 'Terkejut', color: 'bg-emo-terkejut text-orange-800 border-orange-200' },
    { name: 'Jijik', color: 'bg-emo-jijik text-purple-800 border-purple-200' },
    { name: 'Netral', color: 'bg-emo-netral text-gray-800 border-gray-200' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12 md:py-20"
    >
      {/* Hero Section */}
      <div className="max-w-3xl text-center space-y-8 mb-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center justify-center p-3 bg-cream-dark rounded-full mb-4"
        >
          <HeartHandshake className="w-6 h-6 text-terracotta mr-2" />
          <span className="text-sm font-medium tracking-wider uppercase text-ink-light">Serambi Emosi</span>
        </motion.div>
        
        <h1 className="text-5xl md:text-6xl font-serif text-ink leading-tight">
          Dengarkan Emosi,<br/>Pahami Kondisi Batin
        </h1>
        
        <p className="text-lg md:text-xl text-ink-light max-w-2xl mx-auto leading-relaxed">
          Sistem ini memberikan indikasi emosional melalui analisis suara Anda, 
          dirancang sebagai ruang aman untuk refleksi psikologis yang suportif dan empatik.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="mt-8 px-8 py-4 bg-terracotta hover:bg-terracotta-dark text-white rounded-full font-medium text-lg shadow-sm transition-colors duration-300 flex items-center justify-center mx-auto"
        >
          <Mic className="w-5 h-5 mr-2" />
          Mulai Analisis Suara
        </motion.button>
      </div>

      {/* About System (Architecture) */}
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center mb-24">
        <div className="space-y-6">
          <h2 className="text-3xl font-serif text-ink">Bagaimana Sistem Bekerja?</h2>
          <p className="text-ink-light leading-relaxed">
            Teknologi kami memproses suara melalui ekstraksi fitur MFCC (Mel-Frequency Cepstral Coefficients) 
            untuk menangkap karakteristik unik vokal Anda. Data ini kemudian dianalisis menggunakan 
            kecerdasan buatan berbasis model klasifikasi BiLSTM (Bidirectional Long Short-Term Memory), yang mampu memahami pola temporal secara dua arah (maju dan mundur), sehingga menghasilkan deteksi emosi yang lebih akurat dan kontekstual untuk 
            memberikan hasil deteksi emosi yang akurat.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-cream-dark flex flex-col items-start">
            <div className="p-3 bg-sage/20 rounded-xl mb-4 text-sage-dark">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl mb-2">Ekstraksi MFCC</h3>
            <p className="text-sm text-ink-light">Menangkap pola frekuensi dan karakteristik akustik suara Anda.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-cream-dark flex flex-col items-start">
            <div className="p-3 bg-calm-blue/20 rounded-xl mb-4 text-calm-blue-dark">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl mb-2">Analisis BiLSTM</h3>
            <p className="text-sm text-ink-light">Memproses urutan data audio secara dua arah (forward dan backward) untuk mengenali pola emosi dengan lebih presisi dan kontekstual.</p>
          </div>
        </div>
      </div>

      {/* Emotion Categories */}
      <div className="max-w-4xl w-full text-center">
        <h3 className="text-sm font-medium uppercase tracking-widest text-ink-light mb-6">Kategori Emosi yang Dideteksi</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {emotions.map((emo) => (
            <span 
              key={emo.name} 
              className={`px-5 py-2 rounded-full border text-sm font-medium ${emo.color}`}
            >
              {emo.name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
