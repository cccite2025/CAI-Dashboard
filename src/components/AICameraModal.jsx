// src/components/AICameraModal.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Scan, Settings2, CloudRain, Sun, Wind, Droplets, Cloud, Box
} from 'lucide-react';

// 🟢 Import ตัวอ่านไฟล์จริง (IFC)
import { IFCViewer } from './IFCViewer';

// 🟢 Import TensorFlow AI
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const AICameraModal = ({ project, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    // UI States
    const [showControls, setShowControls] = useState(false); 
    
    // AI States
    const [aiModel, setAiModel] = useState(null);
    const [detectedObjects, setDetectedObjects] = useState([]);
    const [isModelLoading, setIsModelLoading] = useState(true);

    // Progress Data
    const plan = project.planPercent || 0;
    const actual = project.actualPercent || 0;
    const gap = actual - plan;
    const isDelay = gap < -5; 

    // Weather Simulation (Mockup สภาพอากาศ)
    const weather = useMemo(() => {
        const conditions = [
            { label: 'Sunny', icon: Sun, color: 'text-yellow-400' },
            { label: 'Cloudy', icon: Cloud, color: 'text-gray-300' },
            { label: 'Rainy', icon: CloudRain, color: 'text-blue-400' }
        ];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return {
            temp: 30 + Math.floor(Math.random() * 5),
            humidity: 60 + Math.floor(Math.random() * 20),
            wind: 10 + Math.floor(Math.random() * 15),
            condition: condition
        };
    }, []);

    // 1. Load AI Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log("Loading AI Model...");
                await tf.ready();
                const loadedModel = await cocoSsd.load();
                setAiModel(loadedModel);
                setIsModelLoading(false);
            } catch (err) {
                console.error("Failed to load AI:", err);
                setIsModelLoading(false);
            }
        };
        loadModel();
    }, []);

    // 2. Start Camera & AI Loop
    useEffect(() => {
        let stream = null;
        let animationFrameId;

        const startSystem = async () => {
            try {
                // เปิดกล้องหลัง (environment)
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        detectFrame();
                    };
                }
            } catch (err) { console.error("Camera Error:", err); }
        };

        const detectFrame = async () => {
            if (!videoRef.current || !canvasRef.current || !aiModel) {
                animationFrameId = requestAnimationFrame(detectFrame);
                return;
            }

            const video = videoRef.current;
            
            if (video.readyState === 4 && video.videoWidth > 0) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // AI ตรวจจับวัตถุ
                const predictions = await aiModel.detect(video);
                
                const objects = predictions.map(p => p.class);
                if (objects.length > 0) setDetectedObjects(objects);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                predictions.forEach(prediction => {
                    const [x, y, width, height] = prediction.bbox;
                    const text = prediction.class;
                    
                    // เน้นสีเฉพาะอุปกรณ์ก่อสร้าง/คน (Mockup logic)
                    const isTarget = ['person', 'truck', 'car', 'cell phone'].includes(text);
                    const color = isTarget ? '#10b981' : '#f59e0b';

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x, y, width, height);

                    ctx.fillStyle = color;
                    const textWidth = ctx.measureText(text).width;
                    ctx.fillRect(x, y - 20, textWidth + 10, 20);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '14px Arial';
                    ctx.fillText(text, x + 5, y - 5);
                });
            }
            animationFrameId = requestAnimationFrame(detectFrame);
        };

        startSystem();

        return () => { 
            if (stream) stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(animationFrameId);
        };
    }, [aiModel]);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-6xl h-[85vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-30 pointer-events-none">
                    <div className="pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="bg-red-500/20 border border-red-500 text-red-500 px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse">LIVE</div>
                                <h3 className="text-white font-bold text-sm tracking-wider">AR SITE INSPECTOR</h3>
                            </div>
                            <p className="text-slate-300 text-[10px] mt-0.5 font-mono">{project.project_code} : {project.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Viewport Area */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    
                    {/* Layer 1: Video (Camera Feed) */}
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
                    
                    {/* Layer 2: AI Canvas (กรอบสี่เหลี่ยมตรวจจับ) */}
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />

                    {/* Layer 3: 3D Model (IFC ของจริง) */}
                    <div className="absolute inset-0 z-20 pointer-events-auto">
                        {project.model_url ? (
                            // ✅✅✅ จุดที่แก้ไข: ใส่ transparent={true} ให้แล้วครับ
                            <IFCViewer modelUrl={project.model_url} transparent={true} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-white/50 bg-black/40 backdrop-blur-sm">
                                <Box size={48} className="mb-2 opacity-50"/>
                                <p>ไม่พบไฟล์โมเดล IFC</p>
                                <p className="text-xs">กรุณาอัปโหลดไฟล์ในเมนูแก้ไขโครงการ</p>
                            </div>
                        )}
                    </div>

                    {/* HUD Info (ข้อมูลด้านข้าง) */}
                    <div className="absolute top-20 left-4 z-30 w-56 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl pointer-events-none">
                        
                        {/* AI Status */}
                        <div className="mb-3 border-b border-white/10 pb-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                                    <Scan size={10}/> AI Detection
                                </span>
                                {isModelLoading ? <span className="text-[9px] text-yellow-400 animate-pulse">Loading...</span> : <span className="text-[9px] text-emerald-400">Active</span>}
                            </div>
                            <div className="text-[10px] text-slate-300 min-h-[15px]">
                                {detectedObjects.length > 0 ? detectedObjects.join(', ') : 'Scanning...'}
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-3 border-b border-white/10 pb-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] text-slate-300 font-bold">PHYSICAL PROGRESS</span>
                                <span className={`text-xs font-mono font-bold ${isDelay ? 'text-red-400' : 'text-emerald-400'}`}>{actual}%</span>
                            </div>
                            <div className="relative h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-blue-500/50" style={{width: `${Math.min(plan, 100)}%`}}></div>
                                <div className={`absolute top-0 left-0 h-full ${isDelay ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor]`} style={{width: `${Math.min(actual, 100)}%`}}></div>
                            </div>
                        </div>

                        {/* Weather */}
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <weather.condition.icon size={20} className={weather.condition.color} />
                                    <div>
                                        <div className="text-xs font-bold text-white leading-none">{weather.temp}°</div>
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-400 border-l border-white/10 pl-2">
                                    <div className="flex items-center gap-1"><Wind size={8}/> {weather.wind}km</div>
                                    <div className="flex items-center gap-1"><Droplets size={8}/> {weather.humidity}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Bar */}
                <div className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 z-30 shrink-0">
                    <span className="text-[10px] text-slate-500">
                        * หมุนโมเดล: คลิกซ้ายลาก | ย้าย: คลิกขวาลาก | ซูม: Scroll Mouse
                    </span>
                    <button onClick={() => setShowControls(!showControls)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600`}>
                        <Settings2 size={14}/> Settings
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AICameraModal;