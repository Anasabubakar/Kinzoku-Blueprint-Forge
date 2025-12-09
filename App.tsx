import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Zap, MessageSquare, Hammer, RotateCcw, 
  FileText, Image as ImageIcon, ZoomIn, ZoomOut, 
  Download, Maximize, Grid, RefreshCw, Layers, Crosshair,
  Wand2, ArrowRight, Pencil, Save, X, Eye, EyeOff
} from 'lucide-react';
import { generateBlueprintSpecs, generateBlueprintImage } from './services/geminiService';
import { BlueprintSpec, ForgeHistoryItem, AppMode } from './types';
import ChatAssistant from './components/ChatAssistant';
import ReverseEngineer from './components/ReverseEngineer';

const LOADING_STATES = [
  "INITIALIZING KINZOKU CORE...",
  "PARSING STRUCTURAL REQUIREMENTS...",
  "QUERYING MATERIAL DATABASE...",
  "CALCULATING STRESS VECTORS...",
  "OPTIMIZING GEOMETRY...",
  "GENERATING ISOMETRIC PROJECTION...",
  "RENDERING 8K TEXTURES...",
  "FINALIZING BLUEPRINT..."
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.FORGE);
  const [showChat, setShowChat] = useState(false);
  
  // Forge State
  const [prompt, setPrompt] = useState('');
  const [lastUsedPrompt, setLastUsedPrompt] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [currentSpec, setCurrentSpec] = useState<BlueprintSpec | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ForgeHistoryItem[]>([]);

  // Editing State
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editedSpec, setEditedSpec] = useState<BlueprintSpec | null>(null);

  // UI State
  const [loadingText, setLoadingText] = useState(LOADING_STATES[0]);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [invertColors, setInvertColors] = useState(false);

  // Core Forge Logic
  const executeForge = async (promptText: string) => {
    if (!promptText.trim() || isForging) return;
    
    setIsForging(true);
    setLastUsedPrompt(promptText); // Store for re-forging
    setZoom(1); 
    setCurrentSpec(null);
    setCurrentImage(null);
    setIsEditingSpecs(false);

    const newItem: ForgeHistoryItem = {
      id: Date.now().toString(),
      prompt: promptText,
      timestamp: Date.now()
    };
    
    try {
      const [specs, imageUrl] = await Promise.all([
        generateBlueprintSpecs(promptText),
        generateBlueprintImage(promptText)
      ]);

      setCurrentSpec(specs);
      setEditedSpec(specs); // Initialize edit state
      setCurrentImage(imageUrl);
      
      setHistory(prev => [{ ...newItem, specs, imageUrl }, ...prev]);
    } catch (error) {
      console.error("Forge failed", error);
      alert("Forge process failed. Check console for details.");
    } finally {
      setIsForging(false);
    }
  };

  const handleForge = () => {
    executeForge(prompt);
  };

  const handleReforge = () => {
    if (lastUsedPrompt) {
      executeForge(lastUsedPrompt);
    }
  };

  const handleRefine = () => {
    if (!refinementInput.trim()) return;
    const newPrompt = `${prompt} ${refinementInput.trim()}`;
    setPrompt(newPrompt); // Update UI
    setRefinementInput(''); // Clear input
    executeForge(newPrompt); // Trigger generation
  };

  const handleRegenerateImageFromSpecs = async () => {
    if (!currentSpec) return;
    setIsForging(true);
    setCurrentImage(null);
    setZoom(1);
    
    // Construct a rich prompt from the current specs
    const specPrompt = `Mechanical object made of ${currentSpec.material}. 
      Dimensions: ${currentSpec.dimensions}. 
      Weight: ${currentSpec.weight}. 
      Design Analysis: ${currentSpec.engineeringAnalysis}.
      Technical description: ${prompt}`; // Include original prompt for context

    try {
        const imageUrl = await generateBlueprintImage(specPrompt);
        setCurrentImage(imageUrl);
        // We don't update history here to keep the original "Forge" record intact, or we could add a new one.
    } catch (error) {
        console.error("Regeneration failed", error);
    } finally {
        setIsForging(false);
    }
  };

  const handleSpecEditChange = (field: keyof BlueprintSpec, value: string) => {
    if (editedSpec) {
      setEditedSpec({ ...editedSpec, [field]: value });
    }
  };

  const saveSpecChanges = () => {
    if (editedSpec) {
      setCurrentSpec(editedSpec);
      setIsEditingSpecs(false);
    }
  };

  const cancelSpecChanges = () => {
    setEditedSpec(currentSpec);
    setIsEditingSpecs(false);
  };

  const loadHistoryItem = (item: ForgeHistoryItem) => {
    setPrompt(item.prompt);
    setLastUsedPrompt(item.prompt);
    if (item.specs) {
        setCurrentSpec(item.specs);
        setEditedSpec(item.specs);
    }
    if (item.imageUrl) setCurrentImage(item.imageUrl);
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `kinzoku-blueprint-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Cycling loading text
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isForging) {
      let index = 0;
      setLoadingText(LOADING_STATES[0]);
      interval = setInterval(() => {
        index = (index + 1) % LOADING_STATES.length;
        setLoadingText(LOADING_STATES[index]);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isForging]);

  return (
    <div className="min-h-screen bg-industrial-900 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-industrial-cyan selection:text-black">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-industrial-700 bg-industrial-900/90 backdrop-blur flex items-center justify-between px-6 z-20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-industrial-cyan rounded-lg text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Hammer size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white">
            KINZOKU <span className="text-industrial-cyan font-light">FORGE</span>
          </h1>
        </div>

        <div className="flex space-x-1 bg-industrial-800 p-1 rounded-lg border border-industrial-700">
          <button 
            onClick={() => setMode(AppMode.FORGE)}
            className={`px-4 py-2 rounded flex items-center space-x-2 transition-all ${mode === AppMode.FORGE ? 'bg-industrial-700 text-white shadow ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Activity size={16} /> <span className="font-mono text-sm">FORGE</span>
          </button>
          <button 
            onClick={() => setMode(AppMode.REVERSE_ENGINEER)}
            className={`px-4 py-2 rounded flex items-center space-x-2 transition-all ${mode === AppMode.REVERSE_ENGINEER ? 'bg-industrial-700 text-white shadow ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <RotateCcw size={16} /> <span className="font-mono text-sm">REVERSE_ENG</span>
          </button>
        </div>

        <button 
          onClick={() => setShowChat(!showChat)}
          className={`p-2 rounded-full border border-industrial-cyan text-industrial-cyan hover:bg-industrial-cyan hover:text-black transition-all ${showChat ? 'bg-industrial-cyan text-black' : ''}`}
        >
          <MessageSquare size={20} />
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Render View Based on Mode */}
        {mode === AppMode.FORGE && (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            
            {/* Left Panel: Controls & Specs */}
            <div className="w-full md:w-1/3 border-r border-industrial-700 bg-industrial-800/50 flex flex-col h-full overflow-hidden z-10">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Input Area */}
                <div className="mb-6 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-industrial-cyan to-blue-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                  <div className="relative">
                    <label className="block text-xs font-mono text-industrial-cyan mb-2 uppercase tracking-widest flex items-center">
                      <Zap size={12} className="mr-1" /> Concept Input
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full h-32 bg-industrial-900 border border-industrial-700 rounded-lg p-4 text-white focus:border-industrial-cyan focus:ring-1 focus:ring-industrial-cyan focus:outline-none font-mono text-sm resize-none shadow-inner"
                      placeholder="Describe the mechanism to forge (e.g., A lightweight titanium exoskeleton joint for heavy lifting)..."
                    />
                    
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={handleForge}
                        disabled={isForging || !prompt}
                        className="flex-1 bg-industrial-cyan hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded shadow-[0_0_20px_rgba(6,182,212,0.2)] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                      >
                        {isForging ? <Activity className="animate-spin" /> : <Hammer />}
                        <span className="font-mono">{isForging ? 'PROCESSING...' : 'FORGE BLUEPRINT'}</span>
                      </button>

                      {/* Re-forge Button */}
                      {(currentSpec || currentImage) && !isForging && lastUsedPrompt && (
                         <button
                           onClick={handleReforge}
                           className="bg-industrial-800 hover:bg-industrial-700 text-industrial-cyan border border-industrial-700 rounded px-4 flex items-center justify-center transition-all tooltip group relative"
                           title="Re-forge with same parameters"
                         >
                           <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                           <span className="ml-2 font-mono text-xs font-bold hidden xl:inline">RE-FORGE</span>
                         </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Refinement Module */}
                {(currentSpec || currentImage) && !isForging && (
                  <div className="mb-8 p-3 bg-industrial-900 border border-industrial-700 rounded-lg animate-in fade-in slide-in-from-top-4">
                    <label className="block text-[10px] font-mono text-industrial-accent mb-2 uppercase tracking-widest flex items-center">
                      <Wand2 size={12} className="mr-1" /> Refine Design
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={refinementInput}
                        onChange={(e) => setRefinementInput(e.target.value)}
                        placeholder="Add directive (e.g. 'Add cooling fins')..."
                        className="flex-1 bg-industrial-800 border border-industrial-700 rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-industrial-cyan focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      />
                      <button
                        onClick={handleRefine}
                        disabled={!refinementInput.trim()}
                        className="bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 text-industrial-cyan px-3 py-2 rounded text-xs font-bold font-mono disabled:opacity-50 transition-colors flex items-center"
                      >
                         <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Specs Card */}
                {currentSpec && editedSpec && (
                  <div className="mb-8 animate-in slide-in-from-left duration-500 fade-in fill-mode-both">
                    <div className="border border-industrial-700 bg-industrial-900 rounded-lg overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-2 opacity-20">
                         <FileText size={48} />
                      </div>
                      <div className="bg-industrial-700/50 px-4 py-2 flex items-center justify-between border-b border-industrial-700">
                        <span className="text-xs font-mono text-industrial-accent flex items-center">
                          <Layers size={12} className="mr-2" /> TECH_SPECS_V1.0
                        </span>
                        
                        {/* Edit Controls */}
                        <div className="flex items-center space-x-2 z-10">
                          {isEditingSpecs ? (
                            <>
                              <button onClick={saveSpecChanges} className="text-green-400 hover:text-green-300 p-1"><Save size={16} /></button>
                              <button onClick={cancelSpecChanges} className="text-red-400 hover:text-red-300 p-1"><X size={16} /></button>
                            </>
                          ) : (
                            <button onClick={() => setIsEditingSpecs(true)} className="text-slate-400 hover:text-industrial-cyan p-1 transition-colors">
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4 relative z-10">
                        <div>
                          <p className="text-slate-500 text-[10px] font-mono mb-1 uppercase tracking-wider">Material Composition</p>
                          {isEditingSpecs ? (
                            <input 
                              value={editedSpec.material}
                              onChange={(e) => handleSpecEditChange('material', e.target.value)}
                              className="w-full bg-black/30 border border-industrial-700 text-white font-mono text-sm p-1 rounded focus:border-industrial-cyan outline-none"
                            />
                          ) : (
                             <p className="text-white font-medium font-mono text-sm border-l-2 border-industrial-cyan pl-3">{currentSpec.material}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-slate-500 text-[10px] font-mono mb-1 uppercase tracking-wider">Est. Weight</p>
                            {isEditingSpecs ? (
                              <input 
                                value={editedSpec.weight}
                                onChange={(e) => handleSpecEditChange('weight', e.target.value)}
                                className="w-full bg-black/30 border border-industrial-700 text-white font-mono text-sm p-1 rounded focus:border-industrial-cyan outline-none"
                              />
                            ) : (
                              <p className="text-white font-medium font-mono text-sm">{currentSpec.weight}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px] font-mono mb-1 uppercase tracking-wider">Dimensions</p>
                            {isEditingSpecs ? (
                              <input 
                                value={editedSpec.dimensions}
                                onChange={(e) => handleSpecEditChange('dimensions', e.target.value)}
                                className="w-full bg-black/30 border border-industrial-700 text-white font-mono text-sm p-1 rounded focus:border-industrial-cyan outline-none"
                              />
                            ) : (
                              <p className="text-white font-medium font-mono text-sm">{currentSpec.dimensions}</p>
                            )}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-industrial-800">
                          <p className="text-slate-500 text-[10px] font-mono mb-2 uppercase tracking-wider">Engineering Analysis</p>
                          {isEditingSpecs ? (
                            <textarea 
                              value={editedSpec.engineeringAnalysis}
                              onChange={(e) => handleSpecEditChange('engineeringAnalysis', e.target.value)}
                              className="w-full h-24 bg-black/30 border border-industrial-700 text-white font-mono text-xs p-1 rounded focus:border-industrial-cyan outline-none resize-none"
                            />
                          ) : (
                            <p className="text-slate-300 text-xs leading-relaxed font-mono">{currentSpec.engineeringAnalysis}</p>
                          )}
                        </div>

                        {!isEditingSpecs && !isForging && (
                          <button 
                            onClick={handleRegenerateImageFromSpecs}
                            className="w-full mt-4 bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 text-industrial-accent text-xs font-mono py-2 rounded flex items-center justify-center space-x-2 transition-all"
                          >
                            <RefreshCw size={12} /> <span>REGENERATE VISUAL FROM SPECS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* History */}
                {history.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono text-slate-500 mb-3 uppercase flex items-center">
                      <Activity size={12} className="mr-2" /> Recent Forges
                    </h3>
                    <div className="space-y-2">
                      {history.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => loadHistoryItem(item)}
                          className="group p-3 border border-industrial-700 rounded bg-industrial-900/50 hover:bg-industrial-800 cursor-pointer transition-colors relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 h-full w-0.5 bg-industrial-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <p className="text-xs text-slate-300 truncate font-mono">{item.prompt}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Visualization */}
            <div className="flex-1 bg-[#0b1121] relative flex items-center justify-center overflow-hidden">
              {/* Technical Grid Background */}
              {showGrid && (
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
                     style={{ 
                       backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                       backgroundSize: '40px 40px' 
                     }}>
                </div>
              )}
              
              {/* Ruler Overlays */}
              <div className="absolute top-0 left-0 w-full h-8 border-b border-industrial-700/50 flex justify-between px-4 items-end text-[10px] font-mono text-slate-600 select-none">
                <span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500</span><span>600</span><span>800</span>
              </div>
              <div className="absolute top-0 left-0 h-full w-8 border-r border-industrial-700/50 flex flex-col justify-between py-4 items-end pr-1 text-[10px] font-mono text-slate-600 select-none">
                 <span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500</span>
              </div>

              {isForging ? (
                <div className="relative flex flex-col items-center z-10 max-w-md w-full p-8 border border-industrial-700/50 bg-industrial-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
                  {/* Scanline Effects */}
                  <div className="absolute inset-0 pointer-events-none opacity-20" 
                       style={{ backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px)', backgroundSize: '100% 4px' }}>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-transparent via-industrial-cyan/20 to-transparent animate-scan pointer-events-none opacity-50"></div>

                  <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-4 border-industrial-800 rounded-full"></div>
                    <div className="absolute inset-0 border-t-4 border-industrial-cyan rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-4 border-industrial-800 rounded-full"></div>
                    <div className="absolute inset-4 border-b-4 border-industrial-cyan rounded-full animate-spin-reverse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Hammer className="text-industrial-cyan animate-pulse" size={32} />
                    </div>
                  </div>
                  
                  {/* Status Text */}
                  <div className="h-8 mb-4 w-full text-center">
                    <p className="font-mono text-industrial-cyan text-sm animate-pulse tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
                      {loadingText}
                    </p>
                  </div>
                  
                  {/* Indeterminate Progress Bar */}
                  <div className="w-full h-2 bg-industrial-800 rounded-full overflow-hidden relative border border-industrial-700">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-industrial-cyan blur-[2px] animate-progress-indeterminate opacity-80"></div>
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-white animate-progress-indeterminate opacity-40"></div>
                  </div>
                  
                  <div className="mt-6 flex flex-col items-center space-y-1">
                    <p className="text-[10px] text-industrial-cyan/70 font-mono tracking-widest uppercase">System Resources Allocated</p>
                    <p className="text-xs text-slate-500 font-mono text-center">
                      Thinking Budget: 32,768 Tokens [ACTIVE]<br/>
                      Model: gemini-3-pro-preview
                    </p>
                  </div>
                </div>
              ) : currentImage ? (
                <div className="relative w-full h-full flex flex-col overflow-hidden">
                   {/* Main Image Canvas */}
                   <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-black/20" onWheel={(e) => setZoom(z => Math.max(0.5, Math.min(4, z + (e.deltaY * -0.001))))}>
                      <img 
                        src={currentImage} 
                        alt="Blueprint" 
                        className="transition-transform duration-200 ease-out object-contain max-h-[90%] max-w-[90%] shadow-2xl"
                        style={{ 
                          transform: `scale(${zoom})`,
                          filter: invertColors ? 'invert(1)' : 'none'
                        }}
                      />
                   </div>

                   {/* Floating Toolbar */}
                   <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-industrial-900/90 border border-industrial-700 rounded-full px-6 py-3 flex items-center space-x-6 backdrop-blur-md shadow-2xl z-20">
                      <div className="flex items-center space-x-2 border-r border-industrial-700 pr-4">
                        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.5))} className="p-2 hover:bg-industrial-800 rounded-full text-slate-300 hover:text-white transition-colors">
                          <ZoomOut size={20} />
                        </button>
                        <span className="font-mono text-xs text-industrial-cyan w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(4, zoom + 0.5))} className="p-2 hover:bg-industrial-800 rounded-full text-slate-300 hover:text-white transition-colors">
                          <ZoomIn size={20} />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setInvertColors(!invertColors)} 
                          className={`p-2 rounded-full transition-colors ${invertColors ? 'text-industrial-cyan bg-industrial-800' : 'text-slate-400 hover:text-white hover:bg-industrial-800'}`}
                          title="Invert Colors / Paper Mode"
                        >
                          {invertColors ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <button 
                          onClick={() => setShowGrid(!showGrid)} 
                          className={`p-2 rounded-full transition-colors ${showGrid ? 'text-industrial-cyan bg-industrial-800' : 'text-slate-400 hover:text-white hover:bg-industrial-800'}`}
                          title="Toggle Grid"
                        >
                          <Grid size={20} />
                        </button>
                        <button 
                          onClick={handleDownload}
                          className="p-2 text-slate-400 hover:text-white hover:bg-industrial-800 rounded-full transition-colors"
                          title="Download Schematic"
                        >
                          <Download size={20} />
                        </button>
                        <button 
                          onClick={() => window.open(currentImage, '_blank')}
                          className="p-2 text-slate-400 hover:text-white hover:bg-industrial-800 rounded-full transition-colors"
                          title="Fullscreen View"
                        >
                          <Maximize size={20} />
                        </button>
                      </div>
                   </div>

                   {/* Corner Info Overlay */}
                   <div className="absolute top-4 right-4 text-right pointer-events-none">
                      <div className="bg-black/40 backdrop-blur border-l-2 border-industrial-cyan p-2">
                        <p className="text-[10px] font-mono text-industrial-cyan">RENDER_ID: {Date.now().toString(16).toUpperCase()}</p>
                        <p className="text-[10px] font-mono text-slate-400">RES: 8192x8192 [SCALED]</p>
                        <p className="text-[10px] font-mono text-slate-400">MODE: {invertColors ? 'PAPER_SCHEMATIC' : 'ISOMETRIC_WIRE'}</p>
                      </div>
                   </div>

                   {/* Crosshair Overlay Center */}
                   <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                     <Crosshair className="text-industrial-cyan" size={48} strokeWidth={0.5} />
                   </div>
                </div>
              ) : (
                <div className="text-center z-10 opacity-40 select-none">
                  <div className="border-2 border-dashed border-slate-700 rounded-2xl p-12">
                    <ImageIcon size={64} className="mx-auto mb-4 text-slate-600" />
                    <p className="font-mono text-slate-500 text-lg">BLUEPRINT VISUALIZATION SYSTEM READY</p>
                    <p className="text-sm text-slate-600 mt-2 font-mono">
                      // AWAITING INPUT PARAMETERS<br/>
                      // GENERATOR: IMAGEN 4.0<br/>
                      // RESOLUTION: 8K
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === AppMode.REVERSE_ENGINEER && (
          <div className="flex-1 bg-industrial-900 overflow-y-auto">
            <ReverseEngineer />
          </div>
        )}

        {/* Floating Chat Panel (Overlay or Sidebar) */}
        {showChat && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-96 z-30 animate-in slide-in-from-right shadow-2xl border-l border-industrial-cyan/30">
            <ChatAssistant onClose={() => setShowChat(false)} />
          </div>
        )}

      </div>
    </div>
  );
};

export default App;