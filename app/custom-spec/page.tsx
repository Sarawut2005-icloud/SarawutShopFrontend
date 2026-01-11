'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

// --- Background Effect ---
function EnergyField({ isOverload, isDark }: { isOverload: boolean, isDark: boolean }) {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(8000), { radius: 1.8 }));
  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / (isOverload ? 2 : 10);
    ref.current.rotation.y -= delta / (isOverload ? 5 : 15);
  });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial 
            transparent 
            color={isOverload ? "#ff0000" : (isDark ? "#00f0ff" : "#2563eb")} 
            size={isOverload ? 0.008 : 0.005} 
            sizeAttenuation={true} 
            depthWrite={false} 
            opacity={isOverload ? 0.8 : 0.5} 
        />
      </Points>
    </group>
  );
}

// --- Component เลือกชิ้นส่วน ---
const PartSelector = ({ label, categoryQuery, selectedItem, onSelect, icon, isDark }: any) => {
    const [items, setItems] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // ดึงข้อมูลเมื่อเปิด Modal
    const openModal = async () => {
        setIsOpen(true);
        setLoading(true);
        try {
            // ✅ ส่ง Category ไปทั้งไทยและอังกฤษ (คั่นด้วย comma)
            const res = await axios.get('http://localhost:3001/products', { 
                params: { category: categoryQuery } 
            });
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div 
                onClick={openModal}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                ${selectedItem 
                    ? (isDark ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-blue-50 border-blue-500 shadow-md')
                    : (isDark ? 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5' : 'bg-white/60 border-gray-200 hover:border-blue-300 hover:bg-white')}`}
            >
                <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl 
                        ${selectedItem 
                            ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
                            : (isDark ? 'bg-white/10 text-gray-500' : 'bg-gray-100 text-gray-400')}`}>
                        {selectedItem ? <img src={selectedItem.image} className="w-full h-full object-cover rounded-lg" /> : icon}
                    </div>
                    <div className="flex-1">
                        <div className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
                        <div className={`font-bold truncate ${selectedItem ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                            {selectedItem ? selectedItem.name : 'คลิกเพื่อเลือกอุปกรณ์...'}
                        </div>
                    </div>
                    {selectedItem && (
                        <div className="text-right">
                            <div className={`font-mono text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>฿{selectedItem.price.toLocaleString()}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal เลือกของ */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`w-full max-w-2xl h-[80vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border
                                ${isDark ? 'bg-[#111] border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-[#151515] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    <span className="text-blue-500">{icon}</span> เลือก {label}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${isDark ? 'bg-gray-800 text-white hover:bg-red-500' : 'bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white'}`}>✕</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {loading ? (
                                    <div className="text-center text-blue-500 py-20 animate-pulse font-mono">LOADING DATA...</div>
                                ) : items.length === 0 ? (
                                    <div className="text-center py-20 opacity-50">
                                        <div className="text-4xl mb-2">📦</div>
                                        <div>ไม่พบสินค้าในหมวดนี้</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {items.map((item) => (
                                            <div 
                                                key={item._id} 
                                                onClick={() => { onSelect(item); setIsOpen(false); }}
                                                className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-all group
                                                    ${isDark 
                                                        ? 'border-gray-800 hover:border-blue-500 hover:bg-blue-900/10' 
                                                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}
                                            >
                                                <img src={item.image} className="w-16 h-16 object-cover rounded bg-gray-100" />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-bold text-sm truncate ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-slate-700 group-hover:text-blue-700'}`}>{item.name}</div>
                                                    <div className={`font-mono text-sm mt-1 ${isDark ? 'text-blue-500' : 'text-blue-600'}`}>฿{item.price.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default function CustomSpecPage() {
    const [spec, setSpec] = useState<any>({
        cpu: null, mb: null, gpu: null, ram: null, ssd: null, psu: null, case: null
    });
    const [isDark, setIsDark] = useState(true);
    
    // โหลด Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme-preference');
        if (savedTheme) setIsDark(savedTheme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
    };
    
    const totalPrice = Object.values(spec).reduce((sum: number, item: any) => sum + (item?.price || 0), 0);
    const isDomainExpansion = totalPrice > 100000;

    // ถ้าเกินแสน บังคับ Dark Mode สีแดง (Domain Expansion)
    // ถ้าไม่เกิน ก็ใช้ isDark ตามปกติ
    const currentBg = isDomainExpansion 
        ? 'bg-[#1a0000]' 
        : (isDark ? 'bg-[#050505]' : 'bg-[#f0f4f8]');
    
    const currentText = isDomainExpansion 
        ? 'text-red-500' 
        : (isDark ? 'text-white' : 'text-slate-900');

    return (
        <div className={`relative min-h-screen w-full font-sans transition-colors duration-700 overflow-hidden ${currentBg} ${currentText}`}>
            
            {/* 3D Background */}
            <div className="fixed inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 1] }}>
                    <color attach="background" args={[isDomainExpansion ? '#1a0000' : (isDark ? '#050505' : '#f0f4f8')]} />
                    <EnergyField isOverload={isDomainExpansion} isDark={isDark} />
                </Canvas>
            </div>

            {/* Grid Overlay */}
            <div className={`fixed inset-0 z-0 pointer-events-none bg-[size:40px_40px] opacity-20
                ${isDomainExpansion 
                    ? 'bg-[linear-gradient(rgba(255,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.1)_1px,transparent_1px)]' 
                    : (isDark 
                        ? 'bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]'
                        : 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)]')}`} 
            />

            <div className="relative z-10 container mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8 min-h-screen">
                
                {/* Left Panel */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <Link href="/product" className={`inline-flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity mb-4 ${isDomainExpansion ? 'text-red-400' : (isDark ? 'text-white' : 'text-slate-600')}`}>
                                ← กลับหน้าร้านค้า
                            </Link>
                            <h1 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 ${isDomainExpansion ? 'text-red-500 animate-pulse' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                                {isDomainExpansion ? 'DOMAIN EXPANSION' : 'JUJUTSU SPEC'}
                            </h1>
                            <p className="font-mono text-xs opacity-70">// SYSTEM_BUILDER_V.9.9 // CUSTOM_MODE</p>
                        </div>
                        <button onClick={toggleTheme} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isDark ? 'bg-white/10 border-white/20 text-yellow-400' : 'bg-white border-gray-300 text-slate-600 shadow-sm'}`}>
                            {isDark ? '☀' : '☾'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* ✅ ส่ง Category ไปทั้ง 2 ภาษาเลย */}
                        <PartSelector label="Central Processing Unit (CPU)" categoryQuery="CPU,ซีพียู,Processor" icon="🧠" selectedItem={spec.cpu} onSelect={(item: any) => setSpec({...spec, cpu: item})} isDark={isDark} />
                        <PartSelector label="Motherboard (Mainboard)" categoryQuery="Motherboard,Mainboard,เมนบอร์ด" icon="🔌" selectedItem={spec.mb} onSelect={(item: any) => setSpec({...spec, mb: item})} isDark={isDark} />
                        <PartSelector label="Graphics Card (GPU)" categoryQuery="GPU,VGA,Graphic Card,การ์ดจอ" icon="🎮" selectedItem={spec.gpu} onSelect={(item: any) => setSpec({...spec, gpu: item})} isDark={isDark} />
                        <PartSelector label="Memory (RAM)" categoryQuery="RAM,Memory,แรม" icon="⚡" selectedItem={spec.ram} onSelect={(item: any) => setSpec({...spec, ram: item})} isDark={isDark} />
                        <PartSelector label="Storage (SSD/HDD)" categoryQuery="SSD,HDD,Storage,ฮาร์ดดิสก์,ฮาร์ดไดร์ฟ" icon="💾" selectedItem={spec.ssd} onSelect={(item: any) => setSpec({...spec, ssd: item})} isDark={isDark} />
                        <PartSelector label="Power Supply (PSU)" categoryQuery="PSU,Power Supply,พาวเวอร์ซัพพลาย" icon="🔋" selectedItem={spec.psu} onSelect={(item: any) => setSpec({...spec, psu: item})} isDark={isDark} />
                        <PartSelector label="PC Case" categoryQuery="Case,Chassis,เคส,เคสคอมพิวเตอร์" icon="📦" selectedItem={spec.case} onSelect={(item: any) => setSpec({...spec, case: item})} isDark={isDark} />
                    </div>
                </div>

                {/* Right Panel: Summary */}
                <div className="lg:w-[400px] flex-shrink-0 flex flex-col gap-4">
                    <div className={`aspect-[3/4] rounded-2xl border-2 relative overflow-hidden flex items-center justify-center backdrop-blur-sm transition-all duration-500
                        ${isDomainExpansion 
                            ? 'bg-black/60 border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.4)]' 
                            : (isDark ? 'bg-black/40 border-blue-500/30 shadow-2xl' : 'bg-white/60 border-blue-200 shadow-xl')}`}
                    >
                        {isDomainExpansion && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none z-0" />}
                        
                        <div className="relative z-10 text-center space-y-4">
                            <div className={`text-6xl ${isDomainExpansion ? 'animate-bounce' : ''}`}>
                                {isDomainExpansion ? '👹' : '🤖'}
                            </div>
                            <div className={`font-mono text-xs opacity-50 tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>
                                {isDomainExpansion ? 'LEVEL: SPECIAL GRADE' : 'LEVEL: SORCERER'}
                            </div>
                        </div>

                        <div className="absolute bottom-0 w-full flex flex-col items-center gap-1 p-4 opacity-50 pointer-events-none">
                            {Object.values(spec).filter(Boolean).map((_, i) => (
                                <motion.div key={i} initial={{ width: 0 }} animate={{ width: "60%" }} className={`h-2 rounded-full ${isDomainExpansion ? 'bg-red-500' : 'bg-blue-500'}`} />
                            ))}
                        </div>
                    </div>

                    <div className={`p-6 rounded-2xl border transition-colors ${isDomainExpansion ? 'bg-[#111] border-red-500' : (isDark ? 'bg-[#111] border-gray-800' : 'bg-white border-blue-100 shadow-lg')}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className={`font-mono text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>ราคารวมสุทธิ</span>
                            <span className={`text-3xl font-black ${isDomainExpansion ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                                ฿{totalPrice.toLocaleString()}
                            </span>
                        </div>
                        <div className={`h-px my-4 ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`} />
                        <button 
                            disabled={totalPrice === 0}
                            className={`w-full py-4 rounded-xl font-bold text-lg tracking-widest transition-all shadow-lg
                            ${isDomainExpansion 
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/50 animate-pulse' 
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50'}`}
                        >
                            {isDomainExpansion ? '🔥 สั่งซื้อชุดเทพเจ้า 🔥' : 'ยืนยันสเปกนี้'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}