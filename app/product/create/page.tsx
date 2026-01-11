'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

const SUGGESTED_CATEGORIES = [
  "คอมเซ็ต", "ซีพียู", "เมนบอร์ด", "การ์ดจอ", "แรม", "ฮาร์ดไดร์ฟ", "พาวเวอร์ซัพพลาย", 
  "ชุดระบายความร้อน", "โน๊ตบุ๊ค", "จอมอนิเตอร์", "คีย์บอร์ด", "เมาส์", 
  "อุปกรณ์เสริม", "เคส", "จัดสเปกคอม"
];

// ----------------------------------------------------------------------
// ✅ ZONE 1: Components ที่แยกออกมาด้านนอก (เพื่อแก้ปัญหาพิมพ์กระตุก)
// ----------------------------------------------------------------------

const StarField = memo(({ isDark }: { isDark: boolean }) => {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={isDark ? "#ffa0e0" : "#1e293b"} size={0.005} sizeAttenuation={true} depthWrite={false} opacity={isDark ? 1 : 0.6} />
      </Points>
    </group>
  );
});

const BackgroundCanvas = memo(({ isDark }: { isDark: boolean }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={[isDark ? '#000000' : '#e2e8f0']} />
        <StarField isDark={isDark} />
      </Canvas>
    </div>
  );
});

// ✅ InputField แยกออกมา
const InputField = ({ label, name, type = "text", placeholder = "", formData, handleChange, isDark }: any) => (
    <div className="group">
        <label className={`block text-[10px] font-bold font-mono mb-2 tracking-widest uppercase transition-colors
            ${isDark ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
            {label}
        </label>
        <input 
            autoComplete="off" 
            type={type} 
            name={name} 
            value={formData[name]} 
            onChange={handleChange} 
            placeholder={placeholder}
            className={`w-full bg-transparent border-b-2 py-3 px-2 font-mono text-lg outline-none transition-all
                ${isDark ? 'border-gray-700 text-white focus:border-cyan-500 focus:bg-white/5' : 'border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'}`}
        />
    </div>
);

// ----------------------------------------------------------------------
// ✅ ZONE 2: Main Component
// ----------------------------------------------------------------------

export default function CreateProduct() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // ✅ เพิ่ม stock: '10' (ค่าเริ่มต้น)
  const [formData, setFormData] = useState<any>({ 
    name: '', price: '', stock: '10', description: '', category: '', image: '', colors: '', brand: '',
    gallery: '', 
    socket: '', cpuSeries: '', coresThreads: '', baseClock: '', boostClock: '', cache: '',
    gpuSeries: '', gpuModel: '', vram: '', busWidth: '', cudaCores: '',
    chipset: '', formFactor: '', memoryType: '', memorySlot: '', maxCapacity: '',
    caseType: '', maxGpuLength: '', wattage: '', efficiencyRating: '', powerRequirement: '',
    warranty: '', points: 0,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) setIsDark(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const finalCategory = formData.category.trim() || "ทั่วไป";
    const finalImage = formData.image || `https://placehold.co/600x400/${isDark ? '1a1a1a/FFF' : 'e2e8f0/1e293b'}?text=${formData.name}`;
    
    const colorsArray = formData.colors ? formData.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c !== '') : [];
    const galleryArray = formData.gallery ? formData.gallery.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [];

    try {
      await axios.post('http://localhost:3001/products', { 
        ...formData, 
        price: Number(formData.price),
        stock: Number(formData.stock), // ✅ ส่งค่า Stock ไป Backend
        cudaCores: Number(formData.cudaCores) || undefined,
        points: Number(formData.points) || 0,
        category: finalCategory,
        image: finalImage,
        colors: colorsArray,
        gallery: galleryArray
      });

      alert('✅ เพิ่มสินค้าเรียบร้อย!');
      router.push('/product'); 
    } catch (err: any) { 
        const backendMessage = err.response?.data?.message;
        const errorMessage = Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || 'ระบบขัดข้อง');
        alert(`❌ เกิดข้อผิดพลาด: ${errorMessage}`);
    } finally {
        setLoading(false); 
    }
  };

  return (
    <div className={`relative min-h-screen w-full font-sans transition-colors duration-700 flex items-center justify-center p-4
        ${isDark ? 'bg-black text-white selection:bg-cyan-500 selection:text-black' : 'bg-slate-200 text-slate-900 selection:bg-blue-600 selection:text-white'}`}
    >
      <BackgroundCanvas isDark={isDark} />

      <div className={`fixed inset-0 z-0 pointer-events-none bg-[size:32px_32px] 
            ${isDark 
                ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]' 
                : 'bg-[linear-gradient(to_right,#33415520_2px,transparent_2px),linear-gradient(to_bottom,#33415520_2px,transparent_2px)] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,#000_80%,transparent_100%)]'}`}
      ></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full max-w-3xl p-1 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl border
            ${isDark ? 'border-white/10 bg-black/60' : 'border-slate-400 bg-slate-100/80'}`}
      >
        <button type="button" onClick={toggleTheme} className={`absolute top-6 right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isDark ? 'border-white/20 text-yellow-400 hover:bg-white/10' : 'border-slate-400 text-slate-600 hover:bg-white'}`}>
            {isDark ? '☀' : '☾'}
        </button>

        <div className="p-8 md:p-12">
            <h1 className={`text-4xl font-black mb-2 tracking-tighter ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500' : 'text-slate-900'}`}>
                เพิ่มสินค้า <span className={isDark ? 'text-white' : 'text-blue-600'}>IT</span>
            </h1>
            <p className={`font-mono text-[10px] tracking-[0.2em] mb-6 ${isDark ? 'text-cyan-500' : 'text-slate-500'}`}>
                // STOCK_UPDATE_PROTOCOL_V.9.5
            </p>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap border-b border-gray-800/50 mb-8 gap-1">
                {[
                  { id: 'basic', label: 'พื้นฐาน (Basic)', icon: '📦' },
                  { id: 'cpu', label: 'CPU Specs', icon: '🧠' },
                  { id: 'gpu', label: 'GPU Specs', icon: '🎮' },
                  { id: 'case_psu', label: 'Case & Power', icon: '🔋' }
                ].map(tab => (
                    <button
                        key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-[10px] font-bold transition-all rounded-t-lg flex items-center gap-2
                        ${activeTab === tab.id 
                            ? (isDark ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'bg-blue-600 text-white')
                            : (isDark ? 'text-gray-500 hover:text-white' : 'text-slate-500 hover:bg-slate-200')}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                    >
                        {/* --- TAB 1: ข้อมูลพื้นฐาน --- */}
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <InputField label="Product Name" name="name" placeholder="Ex. RTX 4090" formData={formData} handleChange={handleChange} isDark={isDark} />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Price (THB)" name="price" type="number" placeholder="0.00" formData={formData} handleChange={handleChange} isDark={isDark} />
                                    {/* ✅ ช่องกรอก STOCK */}
                                    <InputField label="Stock Quantity" name="stock" type="number" placeholder="10" formData={formData} handleChange={handleChange} isDark={isDark} />
                                </div>

                                <div className="group">
                                    <label className={`block text-[10px] font-bold font-mono mb-2 tracking-widest uppercase ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Category</label>
                                    <input 
                                        autoComplete="off" type="text" required name="category" value={formData.category} onChange={handleChange}
                                        className={`w-full bg-transparent border-b-2 py-3 px-2 font-mono text-lg outline-none transition-all mb-3
                                        ${isDark ? 'border-gray-700 text-white focus:border-cyan-500' : 'border-slate-300 text-slate-900 focus:border-blue-600'}`}
                                        placeholder="ระบุหมวดหมู่..."
                                    />
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {SUGGESTED_CATEGORIES.map((cat) => (
                                            <button key={cat} type="button" onClick={() => setFormData((p: any) => ({...p, category: cat}))}
                                                className={`px-3 py-1 rounded-full text-[10px] font-mono border whitespace-nowrap transition-all
                                                ${formData.category === cat 
                                                    ? (isDark ? 'bg-green-500 text-black border-green-500' : 'bg-blue-600 text-white border-blue-600')
                                                    : (isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:border-green-400' : 'bg-white border-slate-300 text-slate-500 hover:border-blue-400')}`}
                                            >{cat}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Colors (e.g. Red, Blue)" name="colors" placeholder="Red, Black" formData={formData} handleChange={handleChange} isDark={isDark} />
                                    <InputField label="Brand" name="brand" placeholder="ASUS, MSI" formData={formData} handleChange={handleChange} isDark={isDark} />
                                </div>
                                
                                <InputField label="Image URL (Cover)" name="image" placeholder="https://..." formData={formData} handleChange={handleChange} isDark={isDark} />
                                
                                <div className="group">
                                    <label className={`block text-[10px] font-bold font-mono mb-2 tracking-widest uppercase ${isDark ? 'text-gray-500 group-hover:text-purple-400' : 'text-slate-500 group-hover:text-blue-600'}`}>Gallery Images (comma separated)</label>
                                    <textarea 
                                        name="gallery" rows={2} value={formData.gallery} onChange={handleChange}
                                        placeholder="https://img1.jpg, https://img2.jpg, https://img3.jpg"
                                        className={`w-full bg-transparent border-2 rounded-lg p-3 font-mono text-xs outline-none transition-all mb-2
                                        ${isDark ? 'border-gray-700 text-gray-300 focus:border-purple-500 focus:bg-white/5' : 'border-slate-300 text-slate-700 focus:border-blue-600 focus:bg-white'}`}
                                    />
                                </div>

                                <div className="group">
                                    <label className={`block text-[10px] font-bold font-mono mb-2 tracking-widest uppercase ${isDark ? 'text-gray-500 group-hover:text-cyan-400' : 'text-slate-500 group-hover:text-blue-600'}`}>Description</label>
                                    <textarea 
                                        name="description" rows={2} value={formData.description} onChange={handleChange}
                                        className={`w-full bg-transparent border-2 rounded-lg p-3 font-mono text-xs outline-none transition-all
                                        ${isDark ? 'border-gray-700 text-gray-300 focus:border-cyan-500' : 'border-slate-300 text-slate-700 focus:border-blue-600'}`}
                                        placeholder="รายละเอียดสเปกสินค้า"
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- TAB 2: CPU Specs --- */}
                        {activeTab === 'cpu' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Socket" name="socket" placeholder="LGA1700" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="CPU Series" name="cpuSeries" placeholder="Core i9" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Cores / Threads" name="coresThreads" placeholder="24C / 32T" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Base Clock" name="baseClock" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Boost Clock" name="boostClock" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Cache" name="cache" formData={formData} handleChange={handleChange} isDark={isDark} />
                            </div>
                        )}

                        {/* --- TAB 3: GPU Specs --- */}
                        {activeTab === 'gpu' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="GPU Model" name="gpuModel" placeholder="RTX 4090" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="VRAM" name="vram" placeholder="24GB GDDR6X" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="CUDA Cores" name="cudaCores" type="number" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Bus Width" name="busWidth" placeholder="384-bit" formData={formData} handleChange={handleChange} isDark={isDark} />
                            </div>
                        )}

                        {/* --- TAB 4: Case & Power --- */}
                        {activeTab === 'case_psu' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Case Type" name="caseType" placeholder="Mid Tower" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Max GPU Length" name="maxGpuLength" placeholder="400mm" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Wattage" name="wattage" placeholder="850W" formData={formData} handleChange={handleChange} isDark={isDark} />
                                <InputField label="Efficiency Rating" name="efficiencyRating" placeholder="80+ Gold" formData={formData} handleChange={handleChange} isDark={isDark} />
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

                {/* Footer Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-800/50 mt-4">
                    <button type="button" onClick={() => router.back()}
                        className={`flex-1 py-4 rounded font-bold tracking-widest transition-all border text-xs
                        ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-800' : 'border-slate-400 text-slate-600 hover:bg-white'}`}
                    >
                        [ ยกเลิก ]
                    </button>
                    <button type="submit" disabled={loading}
                        className={`flex-[2] py-4 rounded font-bold tracking-widest transition-all shadow-lg flex justify-center items-center gap-2 text-xs
                        ${isDark ? 'bg-cyan-600 text-black hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700'}
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'PROCESSING...' : '[ ยืนยันการเพิ่ม ]'}
                    </button>
                </div>
            </form>
        </div>
      </motion.div>
    </div>
  );
}