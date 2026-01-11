'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

// --- CONFIG ---
const API_URL = 'http://localhost:3001/products';
const SUGGESTED_CATEGORIES = [
  "ซีพียู", "เมนบอร์ด", "การ์ดจอ", "แรม", "ฮาร์ดไดร์ฟ", "พาวเวอร์ซัพพลาย", "เคส", "จอมอนิเตอร์", "คีย์บอร์ด", "เมาส์"
];

// --- 🌌 3D BACKGROUND ---
const StarField = memo(({ isDark }: { isDark: boolean }) => {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta / 15; ref.current.rotation.y -= delta / 20; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={isDark ? "#ffa0e0" : "#1e293b"} size={0.005} sizeAttenuation={true} depthWrite={false} opacity={isDark ? 1 : 0.6} />
      </Points>
    </group>
  );
});

const BackgroundCanvas = memo(({ isDark }: { isDark: boolean }) => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <Canvas camera={{ position: [0, 0, 1] }}>
      <color attach="background" args={[isDark ? '#050505' : '#e2e8f0']} />
      <StarField isDark={isDark} />
    </Canvas>
  </div>
));

// --- 🍞 CUSTOM TOAST ---
const Toast = ({ message, type }: any) => (
    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${type === 'success' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
        <span className="text-xl">{type === 'success' ? '✓' : '⚠'}</span>
        <span className="font-mono font-bold">{message}</span>
    </motion.div>
);

// --- COMPONENTS ---
const InputField = ({ label, name, type = "text", placeholder = "", value, onChange, isDark }: any) => (
    <div className="group">
        <label className={`block text-[9px] font-bold font-mono mb-1 tracking-widest uppercase transition-colors ${isDark ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-slate-500 group-focus-within:text-blue-600'}`}>{label}</label>
        <input autoComplete="off" type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className={`w-full bg-transparent border-b-2 py-2 px-1 font-mono text-sm outline-none transition-all ${isDark ? 'border-gray-800 text-white focus:border-cyan-500 focus:bg-white/5' : 'border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'}`} />
    </div>
);

const SpecRow = ({ label, value, isDark }: any) => {
    if (!value) return null;
    return (
      <div className={`flex justify-between py-3 border-b border-dashed ${isDark ? 'border-gray-800' : 'border-slate-300'}`}>
        <span className={`font-mono text-xs opacity-70 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{label}</span>
        <span className={`font-bold font-mono text-sm text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
      </div>
    );
};

// ==========================================
// 🚀 MAIN COMPONENT
// ==========================================
export default function ProductDetailAndEdit() {
  const router = useRouter();
  const params = useParams();
  
  // System State
  const [isDark, setIsDark] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Cart & Wishlist State
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Data State
  const [product, setProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  // View Logic States
  const [activeImage, setActiveImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Edit Logic States
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const theme = localStorage.getItem('theme-preference');
    if (theme) setIsDark(theme === 'dark');
    
    const adminStatus = localStorage.getItem('isAdminMode');
    if (adminStatus === 'true') setIsAdmin(true);

    const cart = JSON.parse(localStorage.getItem('my-shop-cart') || '[]');
    setCartCount(cart.length);

    const wishlist = JSON.parse(localStorage.getItem('my-shop-wishlist') || '[]');
    setWishlistCount(wishlist.length);
    const inList = wishlist.some((item: any) => item._id === params.id);
    setIsInWishlist(inList);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/${params.id}`);
            const data = res.data;
            setProduct(data);
            
            // Set Form (รวม stock)
            const colorsStr = data.colors ? data.colors.join(', ') : '';
            const galleryStr = data.gallery ? data.gallery.join(', ') : '';
            setFormData({ ...data, price: data.price.toString(), stock: data.stock !== undefined ? data.stock.toString() : '10', colors: colorsStr, gallery: galleryStr });

            // Set Gallery & Color
            setActiveImage(data.image);
            setGallery([data.image, ...(data.gallery || [])].filter(Boolean));
            if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);

        } catch (err) {
            showToast('ไม่พบข้อมูลสินค้า', 'error');
            setTimeout(() => router.push('/product'), 2000);
        } finally {
            setLoading(false);
        }
    };

    if (params.id) fetchData();
  }, [params.id, router]);

  // --- UTILS ---
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  // --- 🛒 SHOPPING LOGIC (WITH STOCK CHECK) ---
  const handleAddToCart = () => {
      if (!product) return;
      
      // 1. Check Stock
      if (product.stock !== undefined && product.stock <= 0) {
          showToast('เสียใจด้วย สินค้าหมดแล้วครับ', 'error');
          return;
      }

      // 2. Check Color
      if (product.colors && product.colors.length > 0 && !selectedColor) {
          showToast('กรุณาเลือกสีสินค้าก่อนครับ', 'error');
          return;
      }

      const currentCart = JSON.parse(localStorage.getItem('my-shop-cart') || '[]');
      const newItem = { ...product, selectedColor: selectedColor || 'Standard', cartId: Date.now() };
      const newCart = [...currentCart, newItem];

      localStorage.setItem('my-shop-cart', JSON.stringify(newCart));
      
      setCartCount(newCart.length);
      showToast(`เพิ่มลงตะกร้าแล้ว! (${newCart.length})`, 'success');
  };

  const handleToggleWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem('my-shop-wishlist') || '[]');
      
      if (isInWishlist) {
          const newWishlist = wishlist.filter((item: any) => item._id !== product._id);
          localStorage.setItem('my-shop-wishlist', JSON.stringify(newWishlist));
          setIsInWishlist(false);
          setWishlistCount(newWishlist.length);
          showToast('ลบจากรายการโปรดแล้ว', 'error');
      } else {
          const newWishlist = [...wishlist, product];
          localStorage.setItem('my-shop-wishlist', JSON.stringify(newWishlist));
          setIsInWishlist(true);
          setWishlistCount(newWishlist.length);
          showToast('เพิ่มในรายการโปรดแล้ว ❤️', 'success');
      }
  };

  // --- 🔧 EDIT HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = { ...formData };
    ['id', '_id', 'createdAt', 'updatedAt', '__v'].forEach(k => delete payload[k]);

    payload.price = Number(payload.price);
    payload.stock = Number(payload.stock); // ✅ Save Stock
    payload.cudaCores = payload.cudaCores ? Number(payload.cudaCores) : undefined;
    payload.points = payload.points ? Number(payload.points) : 0;
    payload.category = payload.category?.trim() || 'ทั่วไป';
    payload.image = payload.image || `https://placehold.co/600x400?text=${payload.name}`;
    
    payload.colors = typeof payload.colors === 'string' ? payload.colors.split(',').map((s:string) => s.trim()).filter(Boolean) : payload.colors;
    payload.gallery = typeof payload.gallery === 'string' ? payload.gallery.split(',').map((s:string) => s.trim()).filter(Boolean) : payload.gallery;

    try {
        const res = await axios.patch(`${API_URL}/${params.id}`, payload);
        setProduct(res.data);
        setGallery([res.data.image, ...(res.data.gallery || [])].filter(Boolean));
        setActiveImage(res.data.image);
        showToast('บันทึกข้อมูลสำเร็จ!', 'success');
        setMode('view');
    } catch (err: any) {
        showToast(`บันทึกไม่สำเร็จ: ${err.response?.data?.message || 'Error'}`, 'error');
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulse bg-black text-cyan-500">[ SYSTEM LOADING... ]</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-mono text-red-500 bg-black">[ ERROR: PRODUCT NOT FOUND ]</div>;

  const currentStock = product.stock !== undefined ? product.stock : 10; // Default 10 if missing

  return (
    <div className={`relative min-h-screen w-full font-sans transition-colors duration-700 flex justify-center p-4 py-12 ${isDark ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'}`}>
      <BackgroundCanvas isDark={isDark} />
      <AnimatePresence>{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative z-10 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl border flex flex-col ${isDark ? 'border-white/10 bg-black/80' : 'border-white/50 bg-white/80'}`}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
                <Link href="/product" className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-white'}`}>←</Link>
                <div className={`text-xs font-mono tracking-widest hidden sm:block ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>ID: {params.id}</div>
            </div>
            
            <div className="flex gap-2">
                <button className={`w-10 h-10 rounded-full border flex items-center justify-center relative transition-all group ${isDark ? 'border-white/10 text-white hover:bg-red-500/20 hover:border-red-500' : 'border-slate-300 text-slate-600 hover:bg-red-50'}`}>
                    <span className={`${wishlistCount > 0 ? 'text-red-500' : ''}`}>♥</span>
                    {wishlistCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">{wishlistCount}</span>}
                </button>

                <Link href="/product">
                    <button className={`w-10 h-10 rounded-full border flex items-center justify-center relative transition-all group ${isDark ? 'border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500' : 'border-slate-300 text-slate-600 hover:bg-blue-50'}`}>
                        <span>🛒</span>
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black text-[9px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>}
                    </button>
                </Link>

                {isAdmin && (
                    <button onClick={() => setMode(mode === 'view' ? 'edit' : 'view')} className={`px-4 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>
                        {mode === 'view' ? <span>🔧 EDIT</span> : <span>👁️ VIEW</span>}
                    </button>
                )}
                
                <button onClick={toggleTheme} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isDark ? 'border-white/10 text-yellow-400 hover:bg-white/5' : 'border-slate-300 text-slate-600 hover:bg-white'}`}>{isDark ? '☀' : '☾'}</button>
            </div>
        </div>

        <div className="relative">
            <AnimatePresence mode="wait">
                
                {/* VIEW MODE */}
                {mode === 'view' && (
                    <motion.div key="view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* LEFT: GALLERY */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            <div className={`relative aspect-[16/10] rounded-2xl overflow-hidden border flex items-center justify-center p-4 bg-gradient-to-br ${isDark ? 'from-white/5 to-transparent border-white/10' : 'from-slate-50 to-white border-slate-200'}`}>
                                <AnimatePresence mode="wait">
                                    <motion.img key={activeImage} src={activeImage} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} alt={product.name} className="max-w-full max-h-full object-contain drop-shadow-2xl z-10" />
                                </AnimatePresence>
                                {/* 🔥 STOCK BADGE ON IMAGE */}
                                {currentStock === 0 && <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-sm"><span className="text-3xl font-black text-red-500 border-4 border-red-500 px-6 py-2 rotate-[-15deg]">OUT OF STOCK</span></div>}
                            </div>
                            {gallery.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                    {gallery.map((img, idx) => (
                                        <button key={idx} onClick={() => setActiveImage(img)} className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? (isDark ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-105' : 'border-blue-500 shadow-lg scale-105') : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                            <img src={img} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: INFO */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${isDark ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>{product.category}</span>
                                    {product.brand && <span className={`px-3 py-1 text-[10px] font-bold rounded uppercase border ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-300 text-slate-500'}`}>{product.brand}</span>}
                                    {/* 🔥 LOW STOCK ALERT */}
                                    {currentStock === 1 && <span className="px-3 py-1 text-[10px] font-bold rounded uppercase bg-red-600 text-white animate-pulse">🔥 1 ชิ้นสุดท้าย</span>}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black leading-none uppercase tracking-tight mb-2">{product.name}</h1>
                                <div className="flex items-baseline gap-4">
                                    <span className={`text-4xl font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>฿{product.price.toLocaleString()}</span>
                                    <span className={`text-xs font-mono font-bold ${currentStock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {currentStock > 0 ? `IN STOCK: ${currentStock}` : 'OUT OF STOCK'}
                                    </span>
                                </div>
                            </div>

                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <label className={`text-[10px] font-bold font-mono tracking-widest mb-2 block ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>SELECT COLOR</label>
                                    <div className="flex gap-3">
                                        {product.colors.map((color: string, i: number) => (
                                            <button 
                                                key={i} 
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm relative group
                                                    ${selectedColor === color 
                                                        ? (isDark ? 'border-cyan-400 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'border-blue-600 scale-110 shadow-lg') 
                                                        : 'border-white/20 hover:scale-105'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            >
                                                {selectedColor === color && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/80 drop-shadow-md">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={`text-xs mt-2 font-mono ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Selected: <span className="font-bold uppercase">{selectedColor || 'None'}</span></div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button 
                                    onClick={handleAddToCart}
                                    disabled={currentStock === 0}
                                    className={`flex-1 py-4 rounded-xl font-bold text-sm tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2
                                    ${currentStock === 0 
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                        : (isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700')}`}
                                >
                                    <span>{currentStock === 0 ? '🚫' : '🛒'}</span> {currentStock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
                                </button>
                                <button 
                                    onClick={handleToggleWishlist}
                                    className={`px-6 rounded-xl border flex items-center justify-center text-2xl transition-colors 
                                    ${isInWishlist 
                                        ? 'border-red-500/50 bg-red-500/10 text-red-500' 
                                        : (isDark ? 'border-white/10 hover:bg-white/10 text-gray-400' : 'border-slate-300 hover:bg-slate-100 text-slate-400')}`}
                                >
                                    {isInWishlist ? '♥' : '♡'}
                                </button>
                            </div>

                            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <h3 className="text-xs font-bold mb-4 tracking-[0.2em] opacity-50 flex items-center gap-2">/// TECHNICAL SPECS</h3>
                                <div className="space-y-1">
                                    <SpecRow label="Warranty" value={product.warranty} isDark={isDark} />
                                    <SpecRow label="Socket" value={product.socket} isDark={isDark} />
                                    <SpecRow label="Chipset" value={product.chipset} isDark={isDark} />
                                    <SpecRow label="CPU" value={product.cpuSeries} isDark={isDark} />
                                    <SpecRow label="GPU" value={product.gpuModel} isDark={isDark} />
                                    <SpecRow label="VRAM" value={product.vram} isDark={isDark} />
                                    <SpecRow label="Power" value={product.wattage || product.powerRequirement} isDark={isDark} />
                                    <SpecRow label="Case Type" value={product.caseType} isDark={isDark} />
                                </div>
                            </div>

                            {product.description && <p className={`text-sm leading-relaxed font-mono opacity-80 p-4 border-l-2 ${isDark ? 'border-cyan-500/50' : 'border-blue-500/50'}`}>{product.description}</p>}
                        </div>
                    </motion.div>
                )}

                {/* EDIT MODE (Admin) */}
                {mode === 'edit' && (
                    <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="p-8">
                        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                            <div className="flex flex-wrap border-b border-gray-500/20 mb-4 gap-2">
                                {['basic', 'cpu', 'gpu', 'case_psu'].map(tab => (
                                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-xs font-bold uppercase transition-all rounded-t-lg ${activeTab === tab ? (isDark ? 'bg-white/10 text-cyan-400 border-b-2 border-cyan-400' : 'bg-slate-100 text-blue-600 border-b-2 border-blue-600') : 'opacity-50 hover:opacity-100'}`}>{tab}</button>
                                ))}
                            </div>

                            <form onSubmit={handleSave} className="space-y-8">
                                {activeTab === 'basic' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2"><InputField label="Product Name" name="name" value={formData.name} onChange={handleChange} isDark={isDark} /></div>
                                            <InputField label="Price" name="price" type="number" value={formData.price} onChange={handleChange} isDark={isDark} />
                                            <InputField label="Stock Quantity" name="stock" type="number" value={formData.stock} onChange={handleChange} isDark={isDark} /> {/* ✅ ช่องแก้ Stock */}
                                            <InputField label="Category" name="category" value={formData.category} onChange={handleChange} isDark={isDark} />
                                        </div>
                                        <div className="group"><label className={`block text-[9px] font-bold font-mono mb-1 ${isDark?'text-purple-400':'text-blue-500'}`}>COLORS (Comma Separated)</label><input type="text" name="colors" value={formData.colors} onChange={handleChange} placeholder="Red, Blue, #FF0000" className={`w-full bg-transparent border-b-2 py-2 px-1 font-mono text-sm outline-none ${isDark?'border-gray-700 text-white':'border-slate-300'}`} /></div>
                                        <div className="group"><label className={`block text-[9px] font-bold font-mono mb-1 ${isDark?'text-purple-400':'text-blue-500'}`}>GALLERY IMAGES (Comma Separated)</label><textarea name="gallery" rows={3} value={formData.gallery} onChange={handleChange} className={`w-full bg-transparent border-2 rounded p-3 text-xs font-mono outline-none ${isDark?'border-gray-700 text-gray-300':'border-slate-300'}`} /></div>
                                        <InputField label="Main Image URL" name="image" value={formData.image} onChange={handleChange} isDark={isDark} />
                                        <div className="group"><label className="block text-[9px] font-bold font-mono mb-1">DESCRIPTION</label><textarea name="description" rows={3} value={formData.description} onChange={handleChange} className={`w-full bg-transparent border-2 rounded p-3 text-xs font-mono outline-none ${isDark?'border-gray-700':'border-slate-300'}`} /></div>
                                    </div>
                                )}
                                {/* ... (CPU, GPU, Case Tabs - Same as before) ... */}
                                {activeTab === 'cpu' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-8">
                                        <InputField label="Socket" name="socket" value={formData.socket} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Series" name="cpuSeries" value={formData.cpuSeries} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Cores" name="coresThreads" value={formData.coresThreads} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Base Clock" name="baseClock" value={formData.baseClock} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Boost Clock" name="boostClock" value={formData.boostClock} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Cache" name="cache" value={formData.cache} onChange={handleChange} isDark={isDark} />
                                    </div>
                                )}
                                {activeTab === 'gpu' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-8">
                                        <InputField label="Model" name="gpuModel" value={formData.gpuModel} onChange={handleChange} isDark={isDark} />
                                        <InputField label="VRAM" name="vram" value={formData.vram} onChange={handleChange} isDark={isDark} />
                                        <InputField label="CUDA" name="cudaCores" type="number" value={formData.cudaCores} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Bus Width" name="busWidth" value={formData.busWidth} onChange={handleChange} isDark={isDark} />
                                    </div>
                                )}
                                {activeTab === 'case_psu' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-8">
                                        <InputField label="Type" name="caseType" value={formData.caseType} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Max GPU Len" name="maxGpuLength" value={formData.maxGpuLength} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Wattage" name="wattage" value={formData.wattage} onChange={handleChange} isDark={isDark} />
                                        <InputField label="Efficiency" name="efficiencyRating" value={formData.efficiencyRating} onChange={handleChange} isDark={isDark} />
                                    </div>
                                )}

                                <div className="flex gap-4 pt-6 border-t border-gray-500/20">
                                    <button type="button" onClick={() => setMode('view')} className="flex-1 py-3 rounded-lg font-bold text-xs border opacity-70 hover:opacity-100">CANCEL</button>
                                    <button type="submit" disabled={saving} className={`flex-[2] py-3 rounded-lg font-bold text-xs shadow-lg flex items-center justify-center gap-2 ${isDark ? 'bg-cyan-600 text-black hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700'} ${saving ? 'opacity-50' : ''}`}>
                                        {saving ? 'SAVING...' : '💾 SAVE CHANGES'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}