
import React, { useState, useCallback, useEffect } from 'react';
import Cube3D from './components/Cube3D';
import { generatePerspectiveImage } from './services/geminiService';
import { AppState, Rotation, GeneratedResult } from './types';
import { 
  Upload, 
  RotateCcw, 
  Loader2, 
  Sparkles, 
  History, 
  Trash2, 
  Maximize2, 
  Download, 
  Info,
  Key,
  AlertCircle,
  Zap,
  Terminal,
  Compass,
  ChevronUp,
  ChevronDown,
  Box,
  Eye,
  BrainCircuit
} from 'lucide-react';

declare global {
  var aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    currentRotation: { x: -15, y: 20 },
    isGenerating: false,
    history: [],
    error: null,
    lastPrompt: null,
  });

  const [hasKey, setHasKey] = useState<boolean>(false);
  const [previewItem, setPreviewItem] = useState<GeneratedResult | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string>("");

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        }
      } catch (e) {
        console.warn("Key check failed", e);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyPicker = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      }
    } catch (e) {
      console.error("Failed to open key picker", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setState(prev => ({
          ...prev,
          originalImage: event.target?.result as string,
          error: null
        }));
        setPreviewItem(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotationChange = useCallback((newRot: Rotation) => {
    setState(prev => ({ ...prev, currentRotation: newRot }));
  }, []);

  const updateAngle = (type: 'azimuth' | 'elevation', value: number) => {
    setState(prev => {
      const newRot = { ...prev.currentRotation };
      if (type === 'azimuth') {
        newRot.y = -value;
      } else {
        newRot.x = -value;
      }
      return { ...prev, currentRotation: newRot };
    });
  };

  const setPreset = (x: number, y: number) => {
    setState(prev => ({ ...prev, currentRotation: { x, y } }));
  };

  const resetRotation = () => {
    setPreset(-15, 20);
  };

  const handleGenerate = async () => {
    if (!state.originalImage) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    setLoadingPhase("Gemini 3 Flash 正在优化提示词...");

    try {
      const { imageUrl, prompt } = await generatePerspectiveImage(state.originalImage, state.currentRotation);
      
      const newResult: GeneratedResult = {
        imageUrl: imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        rotation: { ...state.currentRotation }
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastPrompt: prompt,
        history: [newResult, ...prev.history]
      }));
      setPreviewItem(newResult);
      setLoadingPhase("");
    } catch (err: any) {
      console.error("Generation failed:", err);
      let errorMsg = "渲染引擎遇到障碍，请重试。";
      
      if (err.message === "AUTH_ERROR") {
        errorMsg = "身份验证失败。请确保使用的是付费版 API 密钥。";
        setHasKey(false);
      }
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMsg
      }));
      setLoadingPhase("");
    }
  };

  const azimuth = Math.round(-state.currentRotation.y);
  const elevation = Math.round(-state.currentRotation.x);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col overflow-hidden">
      <header className="h-14 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight flex items-center gap-2">
              Vision Re-imaginer
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">
                Gemini 3 Pro
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setState(prev => ({ ...prev, originalImage: null, history: [], error: null, lastPrompt: null }))}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> 清空画布
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="lg:w-72 border-r border-white/5 bg-slate-900/20 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5">
            <button 
              onClick={handleOpenKeyPicker}
              className={`w-full py-2 px-3 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${hasKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <Key className="w-3.5 h-3.5" /> 
              {hasKey ? '付费版 API 已连接' : '连接 API 密钥'}
            </button>
          </div>

          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Upload className="w-3 h-3" /> 上传 2D 原图
            </h2>
            {!state.originalImage ? (
              <label className="group relative block cursor-pointer">
                <div className="border border-dashed border-slate-700 group-hover:border-indigo-500/50 rounded-xl p-6 transition-all flex flex-col items-center gap-3 bg-slate-800/10 hover:bg-indigo-500/5">
                  <Upload className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase">点击上传</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border border-white/10">
                <img src={state.originalImage} alt="Original" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-bold">
                    更换图片
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-b border-white/5 space-y-3">
             <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Eye className="w-3.5 h-3.5" /> 视角预设
             </h2>
             <div className="grid grid-cols-2 gap-2">
               <button onClick={() => setPreset(0, 0)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">正面 (0°)</button>
               <button onClick={() => setPreset(0, 180)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">背面 (180°)</button>
               <button onClick={() => setPreset(0, 90)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">左侧 (90°)</button>
               <button onClick={() => setPreset(0, -90)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">右侧 (-90°)</button>
               <button onClick={() => setPreset(-90, 0)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">顶视 (Top)</button>
               <button onClick={() => setPreset(90, 0)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">底视 (Bottom)</button>
               <button onClick={() => setPreset(-30, 45)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">45° 俯视</button>
               <button onClick={() => setPreset(15, 30)} className="text-[9px] font-bold bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5">微仰视</button>
             </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 shrink-0">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> 渲染历史
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
              {state.history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-10">
                  <History className="w-6 h-6 mb-2" />
                  <p className="text-[9px] font-medium">无历史记录</p>
                </div>
              ) : (
                state.history.map((item) => (
                  <div 
                    key={item.timestamp} 
                    className={`group relative cursor-pointer rounded-lg overflow-hidden border transition-all ${previewItem?.timestamp === item.timestamp ? 'border-indigo-500' : 'border-white/5 hover:border-white/20'}`}
                    onClick={() => setPreviewItem(item)}
                  >
                    <img src={item.imageUrl} alt="History" className="w-full h-16 object-cover opacity-60 group-hover:opacity-100" />
                    <div className="absolute bottom-1 right-1 text-[8px] font-mono text-white/50 bg-black/60 px-1 py-0.5 rounded">
                      AZ:{Math.round(-item.rotation.y)}°
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Center Canvas */}
        <section className="flex-1 bg-[#010409] relative flex flex-col items-center justify-center overflow-hidden">
          {!state.originalImage ? (
            <div className="text-center space-y-4">
              <Compass className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-500">等待初始化</h3>
              <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em]">请先上传一张 2D 图片作为基础</p>
            </div>
          ) : (
            <>
              <Cube3D 
                image={state.originalImage} 
                rotation={state.currentRotation} 
                onRotationChange={handleRotationChange}
              />
              <div className="absolute bottom-8 flex flex-col items-center gap-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-6 shadow-2xl">
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] text-slate-500 uppercase font-bold">水平方位 (AZ)</span>
                     <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         value={azimuth}
                         onChange={(e) => updateAngle('azimuth', parseInt(e.target.value) || 0)}
                         className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono font-bold text-indigo-400"
                       />
                       <div className="flex flex-col">
                         <button onClick={() => updateAngle('azimuth', azimuth + 10)} className="hover:text-indigo-400"><ChevronUp className="w-3 h-3" /></button>
                         <button onClick={() => updateAngle('azimuth', azimuth - 10)} className="hover:text-indigo-400"><ChevronDown className="w-3 h-3" /></button>
                       </div>
                     </div>
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] text-slate-500 uppercase font-bold">垂直仰角 (EL)</span>
                     <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         value={elevation}
                         onChange={(e) => updateAngle('elevation', parseInt(e.target.value) || 0)}
                         className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono font-bold text-indigo-400"
                       />
                       <div className="flex flex-col">
                         <button onClick={() => updateAngle('elevation', elevation + 10)} className="hover:text-indigo-400"><ChevronUp className="w-3 h-3" /></button>
                         <button onClick={() => updateAngle('elevation', elevation - 10)} className="hover:text-indigo-400"><ChevronDown className="w-3 h-3" /></button>
                       </div>
                     </div>
                   </div>
                   <button onClick={resetRotation} className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><RotateCcw className="w-4 h-4" /></button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Right Preview */}
        <aside className="lg:w-96 border-l border-white/5 bg-slate-900/20 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            <button
              onClick={handleGenerate}
              disabled={!state.originalImage || state.isGenerating}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all"
            >
              {state.isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingPhase || "重构中..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成 3D 视角
                </>
              )}
            </button>

            {state.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] flex gap-2">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">渲染预览</h3>
                {previewItem && (
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewItem.imageUrl;
                      link.download = `3d-render.png`;
                      link.click();
                    }}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50 relative group">
                {previewItem ? (
                  <>
                    <img src={previewItem.imageUrl} alt="Result" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => window.open(previewItem.imageUrl, '_blank')}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 p-8 text-center">
                    <Zap className="w-10 h-10 mb-2 opacity-10" />
                    <p className="text-[8px] font-bold uppercase opacity-30">等待渲染任务</p>
                  </div>
                )}
              </div>

              {previewItem && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-indigo-300 leading-relaxed">
                        视角已重构。通过 AI 提示词工程，Gemini 已自动补全被遮挡的纹理并重新映射了光影分布。
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase">
                      <BrainCircuit className="w-3 h-3 text-emerald-400" /> 经 AI 优化的 Banana 指令
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-[8px] text-slate-400 leading-relaxed overflow-hidden">
                      {previewItem.prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
