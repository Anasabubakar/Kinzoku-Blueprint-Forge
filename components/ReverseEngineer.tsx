import React, { useState, useRef } from 'react';
import { Upload, Cpu, Loader2, ArrowRight } from 'lucide-react';
import { analyzeUploadedImage } from '../services/geminiService';

const ReverseEngineer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setAnalysis('');
    try {
      const result = await analyzeUploadedImage(selectedFile, prompt);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis("System malfunction during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2 font-mono tracking-tighter">REVERSE ENGINEERING MODULE</h2>
        <p className="text-slate-400">Upload schematics or photos for Gemini 3 Pro analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        {/* Left: Input */}
        <div className="flex flex-col space-y-6">
          <div 
            className="border-2 border-dashed border-industrial-700 hover:border-industrial-cyan rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-industrial-800/50 min-h-[300px]"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-64 object-contain rounded" />
            ) : (
              <>
                <Upload size={48} className="text-slate-500 mb-4" />
                <span className="text-slate-400 font-mono">Click to upload image</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-mono text-industrial-cyan uppercase tracking-widest">Analysis Focus</label>
             <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Estimate material composition and stress points..."
              className="w-full bg-industrial-900 border border-industrial-700 rounded p-3 text-white focus:border-industrial-cyan focus:outline-none font-mono text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="w-full bg-industrial-cyan hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Cpu />}
            <span className="font-mono">{loading ? 'ANALYZING...' : 'INITIATE ANALYSIS'}</span>
          </button>
        </div>

        {/* Right: Output */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-6 overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-industrial-cyan to-transparent opacity-50"></div>
            <h3 className="text-industrial-accent font-mono mb-4 flex items-center">
              <ArrowRight className="mr-2 w-4 h-4" /> ANALYSIS_OUTPUT_LOG
            </h3>
            
            <div className="flex-1 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {analysis ? (
                analysis
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  Waiting for input data...
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReverseEngineer;
