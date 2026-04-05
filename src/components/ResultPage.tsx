import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Info, Heart, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AnalysisResponse } from '../types/analysis';

interface ResultPageProps {
  file: File | null;
  result: AnalysisResponse | null;
  onReset: () => void;
}

export default function ResultPage({ file, result, onReset }: ResultPageProps) {
  const [data, setData] = useState<Array<{ name: string; value: number; color: string; textColor: string }>>([]);
  const [dominantEmotion, setDominantEmotion] = useState<{ name: string; value: number; color: string; textColor: string } | null>(null);

  useEffect(() => {
    if (!result) return;

    // Map the probabilities from the API result to the format needed for the chart
    const colorMap: Record<string, { bg: string, text: string }> = {
      'Senang': { bg: 'var(--color-emo-senang)', text: '#2e7d32' },
      'Netral': { bg: 'var(--color-emo-netral)', text: '#424242' },
      'Terkejut': { bg: 'var(--color-emo-terkejut)', text: '#e65100' },
      'Sedih': { bg: 'var(--color-emo-sedih)', text: '#1565c0' },
      'Kecewa': { bg: 'var(--color-emo-sedih)', text: '#1565c0' }, // Map Kecewa to Sedih colors
      'Kecewa (Sedih)': { bg: 'var(--color-emo-sedih)', text: '#1565c0' },
      'Jijik': { bg: 'var(--color-emo-jijik)', text: '#6a1b9a' },
    };

    const mappedData = result.probabilities.map((prob) => ({
      name: prob.name,
      value: prob.value,
      color: colorMap[prob.name]?.bg || 'var(--color-emo-netral)',
      textColor: colorMap[prob.name]?.text || '#424242',
    }));

    // Sort by value descending
    const sortedData = [...mappedData].sort((a, b) => b.value - a.value);
    
    setData(sortedData);
    
    // Find the dominant emotion details based on the result
    const dominant = sortedData.find(d => d.name === result.dominant_emotion) || sortedData[0];
    setDominantEmotion(dominant);

  }, [file, result]);

  const getNarrative = (emotionName: string) => {
    switch (emotionName) {
      case 'Senang':
        return "Suara Anda memancarkan energi positif dan keceriaan. Terus pertahankan semangat ini, karena kebahagiaan Anda dapat menular dan membawa dampak baik bagi orang-orang di sekitar Anda.";
      case 'Sedih':
      case 'Kecewa':
      case 'Kecewa (Sedih)':
        return "Terdengar ada beban atau kesedihan dalam nada suara Anda. Tidak apa-apa untuk merasa tidak baik-baik saja. Beri waktu bagi diri sendiri untuk pulih, dan jangan ragu untuk berbagi cerita dengan orang terdekat.";
      case 'Terkejut':
        return "Ada indikasi keterkejutan atau antusiasme mendadak dalam suara Anda. Emosi ini sering kali muncul saat menghadapi hal baru atau tak terduga. Ambil napas sejenak untuk memproses situasi.";
      case 'Jijik':
        return "Terdapat nada ketidaknyamanan atau penolakan. Wajar untuk merasa tidak nyaman terhadap hal-hal tertentu. Penting untuk mengenali batasan diri dan menjaga jarak dari hal yang mengganggu ketenangan Anda.";
      case 'Netral':
        return "Suara Anda terdengar tenang dan stabil. Kondisi emosional yang seimbang ini sangat baik untuk mengambil keputusan yang rasional dan menghadapi aktivitas sehari-hari dengan fokus.";
      default:
        return "Terima kasih telah berbagi suara Anda. Kami berharap analisis ini dapat membantu Anda lebih memahami kondisi batin Anda saat ini.";
    }
  };

  if (!dominantEmotion) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-8rem)] px-4 sm:px-6 py-8 sm:py-10"
    >
      <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 pt-4 sm:pt-6">
        
        {/* Header */}
        <div className="flex justify-center items-center mb-2 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif text-ink text-center">Dashboard Analisis</h1>
        </div>

        <div className="grid md:grid-cols-12 gap-5 sm:gap-8">
          
          {/* Left Column: Summary & Narrative */}
          <div className="md:col-span-5 space-y-8">
            
            {/* Top Section: Emotion Summary */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl p-5 sm:p-8 shadow-sm border border-white/50 relative overflow-hidden"
              style={{ backgroundColor: dominantEmotion.color }}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Sparkles className="w-24 h-24" style={{ color: dominantEmotion.textColor }} />
              </div>
              
              <p className="text-sm font-medium uppercase tracking-widest mb-2" style={{ color: dominantEmotion.textColor, opacity: 0.8 }}>
                Emosi Dominan
              </p>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-4 break-words" style={{ color: dominantEmotion.textColor }}>
                {dominantEmotion.name}
              </h2>
              
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-3xl sm:text-4xl font-light tracking-tighter" style={{ color: dominantEmotion.textColor }}>
                  {dominantEmotion.value}%
                </span>
                <span className="text-sm font-medium mb-1" style={{ color: dominantEmotion.textColor, opacity: 0.7 }}>
                  Confidence Score
                </span>
              </div>
            </motion.div>

            {/* Bottom Section: Psychological Narrative */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-cream-dark"
            >
              <div className="flex items-center gap-3 mb-4 text-terracotta">
                <Heart className="w-6 h-6" />
                <h3 className="font-serif text-lg sm:text-xl text-ink">Refleksi Psikologis</h3>
              </div>
              <p className="text-ink-light leading-relaxed">
                {getNarrative(dominantEmotion.name)}
              </p>
            </motion.div>
            
          </div>

          {/* Right Column: Deep Analysis Graph */}
          <div className="md:col-span-7">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-cream-dark h-full flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6 sm:mb-8 text-calm-blue-dark">
                <Info className="w-6 h-6" />
                <h3 className="font-serif text-lg sm:text-xl text-ink">Analisis Probabilitas Mendalam</h3>
              </div>
              
              <div className="flex-grow w-full h-72 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 12, left: 8, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'var(--color-ink-light)', fontSize: 12, fontWeight: 500 }}
                      width={95}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-cream-dark)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      formatter={(value: number | string | undefined) => [`${value ?? 0}%`, 'Probabilitas']}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 pt-6 border-t border-cream-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-sm text-ink-light break-all">
                  File dianalisis: <span className="font-medium text-ink">{file?.name || 'audio_record.wav'}</span>
                </p>
                
                <button 
                  onClick={onReset}
                  className="w-full sm:w-auto px-6 py-3 bg-cream hover:bg-cream-dark text-ink rounded-full font-medium text-sm transition-colors duration-300 flex items-center justify-center gap-2 border border-cream-dark"
                >
                  <RefreshCw className="w-4 h-4" />
                  Unggah Suara Lain
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
