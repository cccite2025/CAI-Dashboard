import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Box, Loader2, AlertTriangle } from 'lucide-react';
import * as THREE from 'three'; 

export const IFCViewer = forwardRef(({ modelUrl, transparent = false, initialView = null }, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ฟังก์ชันให้แม่สั่งงาน (ดึงค่ามุมกล้อง)
  useImperativeHandle(ref, () => ({
    getCameraState: () => {
        if (!viewerRef.current) return null;
        const controls = viewerRef.current.context.ifcCamera.cameraControls;
        const pos = new THREE.Vector3();
        const target = new THREE.Vector3();
        controls.getPosition(pos);
        controls.getTarget(target);
        return {
            position: { x: pos.x, y: pos.y, z: pos.z },
            target: { x: target.x, y: target.y, z: target.z }
        };
    }
  }));

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    let isMounted = true;

    const initViewer = async () => {
      setLoading(true);
      setError(null);
      
      if (containerRef.current) {
          containerRef.current.innerHTML = '';
      }

      try {
        const container = containerRef.current;
        
        // 1. สร้าง Viewer (เริ่มต้นดำไปก่อน)
        const viewer = new IfcViewerAPI({ 
            container, 
            backgroundColor: new THREE.Color(0x000000) 
        });
        viewerRef.current = viewer;

        // 2. ตั้งค่า WASM
        await viewer.IFC.setWasmPath("/", true);

        // 3. โหลดโมเดล
        if (isMounted) {
            await viewer.IFC.loadIfcUrl(modelUrl);
        }

        // 4. ตั้งค่ามุมกล้อง (Saved View)
        if (initialView && initialView.position && initialView.target) {
            const controls = viewer.context.ifcCamera.cameraControls;
            const { position: p, target: t } = initialView;
            await controls.setPosition(p.x, p.y, p.z, false);
            await controls.setTarget(t.x, t.y, t.z, false);
        }

        // 5. ล็อกแกนเดินบนพื้น
        if (viewer.context && viewer.context.ifcCamera && viewer.context.ifcCamera.cameraControls) {
            const controls = viewer.context.ifcCamera.cameraControls;
            controls.screenSpacePanning = false; 
            controls.maxPolarAngle = Math.PI / 2; 
        }

        // 🔥🔥🔥 6. (จุดแก้) Delay Hack: รอ 100ms ให้ทุกอย่างนิ่ง แล้วค่อยระเบิดพื้นหลังทิ้ง
        // เพื่อป้องกันไม่ให้ Library รีเซ็ตค่าทับ
        if (transparent) {
            setTimeout(() => {
                if (!isMounted || !viewerRef.current) return;
                
                const v = viewerRef.current;
                const rendererContext = v.context.renderer;

                // A. แฮ็กเปลี่ยน Renderer (ให้รองรับ Alpha)
                if (rendererContext && rendererContext.renderer) {
                    const width = container.clientWidth;
                    const height = container.clientHeight;
                    const oldCanvas = rendererContext.renderer.domElement;

                    // ถ้ามันยังไม่เป็น Alpha ให้เปลี่ยนใหม่
                    if (!rendererContext.renderer.getContext().getContextAttributes().alpha) {
                        try { rendererContext.renderer.dispose(); } catch(e){}
                        
                        const newRenderer = new THREE.WebGLRenderer({
                            canvas: oldCanvas,
                            alpha: true,      // ✅ เปิด Alpha
                            antialias: true,
                            powerPreference: 'high-performance'
                        });
                        newRenderer.setSize(width, height);
                        newRenderer.setPixelRatio(window.devicePixelRatio);
                        newRenderer.setClearColor(0x000000, 0); // สีใส
                        rendererContext.renderer = newRenderer;
                    }
                }

                // B. ปิด Post-Production (ตัวบังกล้อง)
                if (v.context.renderer.postProduction) {
                    v.context.renderer.postProduction.active = false;
                }

                // C. ลบพื้นหลัง Scene
                if (v.context.scene) {
                    v.context.scene.background = null;
                }

                // D. บังคับ CSS อีกทีเพื่อความชัวร์
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    canvas.style.backgroundColor = 'transparent';
                    canvas.style.opacity = '0.3'; // โมเดลชัด 100%
                }

            }, 100); // 👈 รอ 0.1 วินาที เป็นไม้ตายสุดท้าย
        } else {
             // โหมดปกติ
             if (viewer.context.scene) viewer.context.scene.background = new THREE.Color(0xf0f0f0);
             if (viewer.context.renderer.renderer) viewer.context.renderer.renderer.setClearColor(0xf0f0f0, 1);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading IFC:", err);
        if (isMounted) {
            if (err.message && err.message.includes("grid")) { setLoading(false); return; }
            setError(err.message || "Unknown error occurred");
            setLoading(false);
        }
      }
    };

    initViewer();

    return () => { isMounted = false; };
  }, [modelUrl, transparent]); 

  if (!modelUrl) return null;

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden ${transparent ? '!bg-transparent' : 'bg-gray-50 border border-gray-200'}`}>
      <div ref={containerRef} className="absolute inset-0 z-0 !bg-transparent" style={{background: 'transparent'}} />
      
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm text-white">
          <Loader2 className="animate-spin mb-2" size={32} />
          <span className="text-sm font-medium">กำลังโหลดโมเดล...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
          <AlertTriangle size={48} className="text-red-500 mb-3"/>
          <p className="text-xs text-gray-300 font-mono break-all">{error}</p>
        </div>
      )}
    </div>
  );
});