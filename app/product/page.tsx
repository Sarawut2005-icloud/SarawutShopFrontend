'use client';

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

// ✅ Interface
interface Product {
  _id: string;
  id?: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  colors?: string[]; 
  brand?: string;    
}

// --- StarField ---
const StarField = memo(({ isDark }: { isDark: boolean }) => {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(6000), { radius: 1.5 }));
  useFrame((state, delta) => {
    if (ref.current) {
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={isDark ? "#ffa0e0" : "#2563eb"} size={0.005} sizeAttenuation={true} depthWrite={false} opacity={isDark ? 1 : 0.6} />
      </Points>
    </group>
  );
});

// --- Mascot ---
function Mascot({ isDark }: { isDark: boolean }) {
    const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
    useEffect(() => {
        const handleResize = () => setWindowSize({ w: window.innerWidth - 140, h: window.innerHeight - 140 });
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    if (windowSize.w === 0) return null;

    return (
        <motion.div className="fixed top-0 left-0 z-50 pointer-events-none" animate={{ x: [0, windowSize.w, windowSize.w, 0, 0], y: [0, 0, windowSize.h, windowSize.h, 0] }} transition={{ duration: 20, ease: "linear", repeat: Infinity }}>
            <motion.div animate={{ y: [0, -10, 0], scaleX: [1, 1, -1, -1, 1] }} transition={{ y: { duration: 0.4, repeat: Infinity }, scaleX: { duration: 20, repeat: Infinity, times: [0, 0.49, 0.5, 0.99, 1] } }}>
                <img src={isDark ? "/gojo.png" : "/gojo1.png"} alt="Mascot" className="w-32 drop-shadow-2xl filter hover:scale-110 transition-transform" />
            </motion.div>
        </motion.div>
    );
}

// --- Checkout Modal ---
function CheckoutModal({ isOpen, onClose, status, orderId }: { isOpen: boolean, onClose: () => void, status: 'processing' | 'success', orderId: string }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-black border border-green-500/50 p-8 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.2)] max-w-md w-full text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                {status === 'processing' ? (
                    <div className="space-y-6">
                        <div className="text-4xl animate-bounce">🦭</div>
                        <h2 className="text-2xl font-mono text-green-500 font-bold tracking-widest animate-pulse">กำลังประมวลผล...</h2>
                        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-green-900"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "easeInOut" }} className="h-full bg-green-500" /></div>
                        <p className="font-mono text-xs text-green-400/70">กำลังตรวจสอบข้อมูล...<br/>กำลังเชื่อมต่อธนาคาร...<br/>กำลังออกใบเสร็จ...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center text-4xl mx-auto font-bold">✓</motion.div>
                        <h2 className="text-3xl font-black italic text-white">ชำระเงินสำเร็จ</h2>
                        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded text-left font-mono text-sm space-y-2">
                            <div className="flex justify-between text-green-400"><span>สถานะ:</span><span>สำเร็จ</span></div>
                            <div className="flex justify-between text-white"><span>รหัสออเดอร์:</span><span>{orderId}</span></div>
                            <div className="flex justify-between text-gray-400 text-xs mt-2 pt-2 border-t border-green-500/30"><span>วันที่:</span><span>{new Date().toLocaleDateString()}</span></div>
                        </div>
                        <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold tracking-widest hover:bg-gray-200 transition-colors rounded">CLOSE</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// --- 🃏 CyberCard (Classic) ---
function CyberCard({ product, onDelete, onAddToCart, onToggleWishlist, isWishlisted, isDark, isAdmin }: any) {
  const displayId = product._id || product.id; 
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0, filter: "blur(10px)" }} whileHover={{ scale: 1.02, zIndex: 10 }} className={`group relative h-[480px] w-full backdrop-blur-md rounded-xl overflow-hidden border transition-all duration-500 ${isDark ? 'bg-black/40 border-white/10 hover:border-cyan-500/50' : 'bg-white/60 border-blue-200/50 shadow-lg shadow-blue-100'}`}>
      <div className={`absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? 'bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10' : 'bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-transparent'}`} />
      
      {/* ❤️ Wishlist Button */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product); }}
        className={`absolute top-3 left-3 z-30 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all shadow-sm active:scale-90 ${isWishlisted ? 'bg-red-500 text-white scale-110' : (isDark ? 'bg-black/50 text-gray-400 hover:text-red-400' : 'bg-white/80 text-gray-400 hover:text-red-500')}`}
      >
        {isWishlisted ? '♥' : '♡'}
      </button>

      <div className="relative h-[50%] w-full overflow-hidden p-4">
        {/* Wrap Image with Link */}
        <Link href={`/product/${displayId}`}>
            <motion.img 
                src={product.image || 'https://via.placeholder.com/300'} 
                alt={product.name} 
                className="w-full h-full object-contain drop-shadow-xl cursor-pointer" 
                whileHover={{ scale: 1.1, rotate: 2 }} 
                transition={{ duration: 0.4 }} 
            />
        </Link>

        <div className={`absolute top-2 right-2 z-20 px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded border backdrop-blur-md ${isDark ? 'bg-black/60 border-cyan-500/30 text-cyan-400' : 'bg-white/80 border-blue-500/30 text-blue-600 shadow-sm'}`}>
            {product.category}
        </div>
        
        {/* Color Dots */}
        <div className="absolute bottom-2 left-2 flex gap-1 z-20 bg-black/20 p-1 rounded backdrop-blur-sm">
            {product.colors && product.colors.length > 0 ? (
                product.colors.map((color: string, idx: number) => (
                    <div key={idx} className="group/color relative">
                        <span 
                            className="block w-4 h-4 rounded-full border border-white/50 shadow-sm hover:scale-125 transition-transform cursor-help"
                            style={{ backgroundColor: color }} 
                        />
                    </div>
                ))
            ) : (
                <span className="text-[9px] text-gray-400 px-1">Std</span>
            )}
        </div>
      </div>

      <div className="relative z-10 p-6 flex flex-col h-[50%] justify-between">
        <div>
            {/* Wrap Name with Link */}
            <Link href={`/product/${displayId}`}>
                <h3 className={`text-lg font-bold mb-1 truncate transition-colors font-mono cursor-pointer hover:underline ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-blue-600'}`}>
                    {product.name}
                </h3>
            </Link>
            <div className={`w-10 h-[2px] mb-3 group-hover:w-full transition-all duration-500 ${isDark ? 'bg-purple-500' : 'bg-blue-400'}`} />
            <p className={`text-xs line-clamp-2 font-mono h-8 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{product.description}</p>
        </div>
        <div>
            <div className={`text-2xl font-bold mb-4 font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>฿{product.price.toLocaleString()}</div>
            <div className="flex gap-2">
                {!isAdmin && (
                    <button onClick={() => onAddToCart(product)} className={`flex-1 py-2 rounded font-bold text-sm tracking-wider transition-all shadow-lg ${isDark ? 'bg-cyan-600 text-black hover:bg-cyan-400 shadow-cyan-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}>
                        [+] ใส่ตะกร้า
                    </button>
                )}
                {isAdmin && (
                    <>
                        <Link href={`/product/${displayId}`} className="flex-1">
                            <button className={`w-full py-2 flex items-center justify-center rounded border transition-all ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>✎ แก้ไข</button>
                        </Link>
                        <button onClick={() => onDelete(displayId)} className={`w-12 flex items-center justify-center rounded border transition-all ${isDark ? 'border-red-500/50 text-red-400 hover:bg-red-500/20' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>✕</button>
                    </>
                )}
            </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Cart Drawer ---
function CartDrawer({ isOpen, onClose, cartItems, onRemove, isDark, onCheckout }: any) {
    const [couponCode, setCouponCode] = useState('');
    const [activeCoupon, setActiveCoupon] = useState<any>(null);
    const [couponMsg, setCouponMsg] = useState('');
    const [loadingCoupon, setLoadingCoupon] = useState(false);

    const handleApplyCoupon = async () => {
        if(!couponCode) return;
        setLoadingCoupon(true);
        setCouponMsg('');
        try {
            const res = await axios.post('http://localhost:3001/products/coupon', { code: couponCode });
            setActiveCoupon(res.data);
            setCouponMsg(res.data.message);
        } catch (err: any) {
            setActiveCoupon(null);
            setCouponMsg('✗ ไม่พบโค้ดส่วนลดนี้');
        } finally { setLoadingCoupon(false); }
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let discount = 0;
        cartItems.forEach((item: Product) => {
            subtotal += item.price;
            if (activeCoupon && (activeCoupon.category === 'all' || activeCoupon.category === item.category)) {
                discount += (item.price * activeCoupon.discount) / 100;
            }
        });
        return { subtotal, discount, total: subtotal - discount };
    };

    const { subtotal, discount, total } = calculateTotals();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md border-l shadow-2xl p-6 flex flex-col ${isDark ? 'bg-black/90 border-white/10 text-white' : 'bg-white/95 border-blue-100 text-slate-900'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2"><span className="text-3xl">𓄿</span> คลังสินค้า</h2>
                            <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                            {cartItems.length === 0 ? <div className="text-center opacity-40 mt-20 font-mono">[ EMPTY CART ]<br/>ยังไม่มีสินค้า</div> : cartItems.map((item: Product, index: number) => (
                                <motion.div key={`${item.id || item._id}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 p-3 rounded-lg border items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded bg-black" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate text-sm">{item.name}</div>
                                        <div className={`text-xs font-mono mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{item.category}</div>
                                        <div className={`text-xs font-mono ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>฿{item.price.toLocaleString()}</div>
                                    </div>
                                    <button onClick={() => onRemove(index)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">✕</button>
                                </motion.div>
                            ))}
                        </div>
                        <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex gap-2">
                                <input type="text" placeholder="CODE: SAVE30" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className={`flex-1 bg-transparent outline-none font-mono text-sm border-b ${isDark ? 'border-gray-600 text-white placeholder-gray-600' : 'border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                                <button onClick={handleApplyCoupon} disabled={loadingCoupon || !couponCode} className={`px-4 py-1 text-xs font-bold rounded transition-all ${isDark ? 'bg-cyan-600 text-black hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-500'} ${loadingCoupon ? 'opacity-50 cursor-wait' : ''}`}>{loadingCoupon ? '...' : 'APPLY'}</button>
                            </div>
                            {couponMsg && <div className={`text-xs mt-2 font-mono ${couponMsg.includes('✗') ? 'text-red-500' : 'text-green-500'}`}>{couponMsg}</div>}
                        </div>
                        <div className="pt-4 mt-2 border-t border-dashed border-gray-500/30 space-y-2">
                            <div className="flex justify-between items-end pt-2">
                                <span className="font-mono text-sm opacity-80">ผลรวม:</span>
                                <span className={`text-3xl font-black tracking-tighter ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>฿{total.toLocaleString()}</span>
                            </div>
                            <button onClick={() => onCheckout(total, activeCoupon?.code || '')} disabled={cartItems.length === 0} className={`w-full py-4 rounded font-bold tracking-widest text-lg transition-all mt-4 ${isDark ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-lg'} ${cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>ชำระเงิน ➔</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ==========================================
// 🚀 MAIN PAGE COMPONENT
// ==========================================
export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // ✅ States ที่ต้อง Sync
  const [cart, setCart] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Advanced Search
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('asc'); 

  const [isListening, setIsListening] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [orderId, setOrderId] = useState('');

  // 🔄 REFRESH STORAGE & AUTH
  const refreshStorage = () => {
      const savedCart = JSON.parse(localStorage.getItem('my-shop-cart') || '[]');
      const savedWishlist = JSON.parse(localStorage.getItem('my-shop-wishlist') || '[]');
      setCart(savedCart);
      setWishlist(savedWishlist);

      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('customerName');
      setIsLoggedIn(!!role);
      setUserName(name || 'Customer');
  };

  // 1. Initial Load & Listeners
  useEffect(() => {
    const savedAdmin = localStorage.getItem('isAdminMode');
    if (savedAdmin === 'true') setIsAdmin(true);
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    refreshStorage();
    setIsLoaded(true);

    window.addEventListener('storage', refreshStorage);
    window.addEventListener('focus', refreshStorage);
    
    return () => {
        window.removeEventListener('storage', refreshStorage);
        window.removeEventListener('focus', refreshStorage);
    };
  }, []);

  // 2. Sync State back to LocalStorage
  useEffect(() => { 
      if (isLoaded) localStorage.setItem('my-shop-cart', JSON.stringify(cart)); 
  }, [cart, isLoaded]);

  useEffect(() => { 
      if (isLoaded) localStorage.setItem('my-shop-wishlist', JSON.stringify(wishlist)); 
  }, [wishlist, isLoaded]);

  const toggleAdminMode = () => {
    const newAdminState = !isAdmin;
    setIsAdmin(newAdminState);
    localStorage.setItem('isAdminMode', newAdminState.toString());
  };

  const toggleTheme = () => {
      const newTheme = !isDark;
      setIsDark(newTheme);
      localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH'; 
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListening(true);
      recognition.onresult = (event: any) => {
        setSearchQuery(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else { alert('Browser นี้ไม่รองรับการสั่งงานด้วยเสียงครับ'); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
        const res = await axios.get('http://localhost:3001/products', {
            params: { keyword: searchQuery, minPrice: minPrice, maxPrice: maxPrice, sort: sort }
        });
        setProducts(res.data);
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchProducts(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, minPrice, maxPrice, sort]);

  // --- Handlers ---
  const handleAddToCart = (product: Product) => { 
      setCart([...cart, { ...product, cartId: Date.now() } as any]); 
      setIsCartOpen(true); 
  };
  
  const handleRemoveFromCart = (index: number) => { 
      const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); 
  };

  const handleToggleWishlist = (product: Product) => {
      if (wishlist.some(p => p._id === product._id)) {
          setWishlist(prev => prev.filter(p => p._id !== product._id));
      } else {
          setWishlist(prev => [...prev, product]);
      }
  };

  // 🔥 FIX: ลบสินค้าแล้วต้องลบออกจาก Wishlist ด้วย
  const handleDelete = async (id: string) => {
    if(!confirm('ยืนยันการลบสินค้า?')) return;
    try { 
        await axios.delete(`http://localhost:3001/products/${id}`); 
        fetchProducts(); // โหลดข้อมูลใหม่

        // ✅ อัปเดต Wishlist: ลบสินค้าที่ตรงกับ ID ออก
        const newWishlist = wishlist.filter(item => item._id !== id);
        setWishlist(newWishlist); 
        
        // (Optional) ลบจาก Cart ด้วยถ้าต้องการ
        // const newCart = cart.filter(item => item._id !== id);
        // setCart(newCart);

    } catch { alert('SYSTEM ERROR'); }
  };

  const handleCheckout = async (total: number, couponCode: string) => {
      setIsCartOpen(false);
      setCheckoutStep('processing');
      try {
          const res = await axios.post('http://localhost:3001/products/checkout', { items: cart, total: total, coupon: couponCode });
          setTimeout(() => {
              setOrderId(res.data.orderId);
              setCheckoutStep('success');
              setCart([]);
              localStorage.removeItem('my-shop-cart');
          }, 2500);
      } catch (err) { alert('Checkout Failed'); setCheckoutStep('idle'); }
  };

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category).filter(c => c && c.trim() !== ''))).sort()], [products]);
  const displayProducts = useMemo(() => products.filter(p => selectedCategory === 'All' || p.category === selectedCategory), [products, selectedCategory]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-sans transition-colors duration-700 ${isDark ? 'bg-black selection:bg-cyan-500 selection:text-black' : 'bg-[#f0f4f8] selection:bg-blue-500 selection:text-white'}`}>
      
      <CheckoutModal isOpen={checkoutStep !== 'idle'} status={checkoutStep === 'processing' ? 'processing' : 'success'} orderId={orderId} onClose={() => setCheckoutStep('idle')} />

      <div className="fixed inset-0 z-0"><Canvas camera={{ position: [0, 0, 1] }}><color attach="background" args={[isDark ? '#000000' : '#f0f4f8']} /><StarField isDark={isDark} /></Canvas></div>
      <div className={`fixed inset-0 z-0 pointer-events-none bg-[size:24px_24px] ${isDark ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]' : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]'}`}></div>
      <Mascot isDark={isDark} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className={`flex flex-col gap-6 md:flex-row justify-between items-end mb-10 border-b pb-8 backdrop-blur-sm transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-blue-900/10'}`}>
            <div className="relative">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className={`h-1 mb-4 bg-gradient-to-r ${isDark ? 'from-cyan-500 to-purple-600' : 'from-blue-600 to-cyan-400'}`} />
                <h1 className={`text-6xl md:text-8xl font-black tracking-tighter mix-blend-difference ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    I HAVEN'T<span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-cyan-400 to-purple-500' : 'from-blue-600 to-cyan-500'}`}>{isDark ? 'CPU' : 'CPU'}</span>
                </h1>
                <p className={`font-mono mt-2 tracking-[0.3em] text-xs ${isDark ? 'text-cyan-500' : 'text-blue-600'}`}>// By // Sarawut</p>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-end">
                {/* ✅ ปุ่มจัดสเปกคอม */}
                <Link href="/custom-spec">
                    <button className={`px-4 py-2 rounded-full font-bold text-xs border transition-all whitespace-nowrap flex items-center gap-2 ${isDark ? 'bg-purple-600/20 text-purple-400 border-purple-500 hover:bg-purple-600 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white text-purple-600 border-purple-200 hover:border-purple-500 shadow-sm'}`}>
                        <span>🧙‍♂️</span> จัดสเปกคอม
                    </button>
                </Link>

                {/* ✅ ปุ่ม Dashboard (Admin Only) */}
                {isAdmin && (
                    <Link href="/dashboard">
                        <button className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500 hover:bg-purple-500 hover:text-black' : 'bg-white text-purple-600 border-purple-200'}`}>
                            📊
                        </button>
                    </Link>
                )}

                {/* ✅ ปุ่ม Login */}
                <Link href="/login">
                    <button className={`px-4 py-2 rounded-full font-bold text-xs border flex items-center gap-2 ${isLoggedIn ? (isDark ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-white text-green-600 border-green-500') : (isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-600 border-slate-300')}`}>
                        <span>👤</span> {isLoggedIn ? userName : 'LOGIN'}
                    </button>
                </Link>

                <button onClick={toggleAdminMode} className={`px-4 py-2 rounded-full font-bold text-xs border transition-all whitespace-nowrap ${isAdmin ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-green-500 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}>
                    {isAdmin ? '𖠋 แอดมิน' : '𖨆 ลูกค้า'}
                </button>
                <button onClick={toggleTheme} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${isDark ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20' : 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300'}`}>{isDark ? '☀' : '☾'}</button>
                
                {/* ✅ Wishlist Icon */}
                <button className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 relative group ${isDark ? 'bg-transparent text-white border-white/20 hover:border-red-500' : 'bg-white text-slate-600 border-slate-300 hover:border-red-500'}`}>
                    <span className={wishlist.length > 0 ? 'text-red-500' : ''}>♥</span>
                    {wishlist.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">{wishlist.length}</span>}
                </button>

                {/* ✅ Cart Icon */}
                {!isAdmin && (
                    <button onClick={() => setIsCartOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 group ${isDark ? 'bg-transparent text-white border-cyan-500 hover:bg-cyan-500 hover:text-black' : 'bg-white text-blue-600 border-blue-500 hover:bg-blue-600 hover:text-white shadow-sm'}`}>
                        <span className="text-lg">🛒</span>
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">{cart.length}</span>}
                    </button>
                )}
                {isAdmin && <Link href="/product/create"><button className={`w-10 h-10 flex items-center justify-center rounded border transition-colors ${isDark ? 'bg-transparent text-white border-white/20 hover:border-cyan-500' : 'bg-white text-slate-800 border-slate-300 hover:border-blue-500 shadow-sm'}`}>+</button></Link>}
            </div>
        </div>

        {/* Top Filter Bar */}
        <div className={`mb-8 p-6 rounded-2xl border backdrop-blur-md flex flex-col md:flex-row gap-4 items-end transition-all ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-blue-100 shadow-lg'}`}>
             <div className="w-full md:flex-1">
                <label className={`text-[10px] font-mono mb-1 block opacity-70 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>SEARCH KEYWORD</label>
                <div className="relative">
                    <input type="text" placeholder={isListening ? "กำลังฟัง..." : "พิมพ์ค้นหา หรือกดไมค์..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-transparent outline-none border-b py-2 pr-10 font-mono text-sm transition-all ${isListening ? 'border-red-500 text-red-500' : (isDark ? 'border-white/30 text-white focus:border-cyan-400' : 'border-slate-300 text-slate-900 focus:border-blue-500')}`} />
                    <button onClick={startListening} className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:scale-110 transition-transform ${isListening ? 'animate-pulse text-red-500' : 'text-gray-400'}`}>{isListening ? '●' : '🎤'}</button>
                </div>
             </div>
             {/* ... (Filter Inputs - Keep Same) ... */}
             <div className="flex gap-4 w-full md:w-auto">
                <div><label className={`text-[10px] font-mono mb-1 block opacity-70 ${isDark?'text-cyan-400':'text-blue-600'}`}>MIN</label><input type="number" placeholder="0" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} className={`w-20 bg-transparent outline-none border-b py-2 font-mono text-sm ${isDark?'border-white/30 text-white':'border-slate-300 text-slate-900'}`}/></div>
                <div><label className={`text-[10px] font-mono mb-1 block opacity-70 ${isDark?'text-cyan-400':'text-blue-600'}`}>MAX</label><input type="number" placeholder="Max" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} className={`w-20 bg-transparent outline-none border-b py-2 font-mono text-sm ${isDark?'border-white/30 text-white':'border-slate-300 text-slate-900'}`}/></div>
             </div>
             <div className="w-full md:w-32">
                <label className={`text-[10px] font-mono mb-1 block opacity-70 ${isDark?'text-cyan-400':'text-blue-600'}`}>SORT</label>
                <select value={sort} onChange={(e)=>setSort(e.target.value)} className={`w-full bg-transparent outline-none border-b py-2 font-mono text-sm cursor-pointer ${isDark?'border-white/30 text-white bg-black':'border-slate-300 text-slate-900 bg-white'}`}>
                    <option value="asc">ถูก ➔ แพง</option><option value="desc">แพง ➔ ถูก</option>
                </select>
             </div>
             <button onClick={()=>{setSearchQuery('');setMinPrice('');setMaxPrice('');setSort('asc');}} className={`px-4 py-2 rounded text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${isDark?'border-red-500/50 text-red-400':'border-red-300 text-red-500'}`}>RESET</button>
        </div>

        {/* Categories Tabs */}
        <div className="mb-10 relative group">
            <div className={`absolute inset-0 rounded-xl blur-xl opacity-50 transition-colors duration-500 ${isDark ? 'bg-cyan-500/10' : 'bg-blue-500/10'}`}></div>
            <div className={`relative p-2 rounded-2xl border backdrop-blur-md overflow-hidden ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/60 border-blue-100'}`}>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-2 scroll-smooth">
                    {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`relative px-6 py-2 rounded-xl font-mono text-sm font-bold tracking-wider transition-all duration-300 whitespace-nowrap border ${selectedCategory === cat ? (isDark ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' : 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105') : (isDark ? 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-cyan-400 hover:border-white/10' : 'bg-transparent text-slate-500 border-transparent hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100')}`}>{cat}</button>))}
                </div>
            </div>
        </div>

        {loading && <div className={`flex flex-col items-center justify-center h-64 font-mono animate-pulse ${isDark ? 'text-cyan-500' : 'text-blue-600'}`}><div className="text-4xl mb-4">กำลังโหลดข้อมูล...</div></div>}
        
        <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayProducts.length > 0 ? (
                    displayProducts.map((p) => (
                        <CyberCard 
                            key={p._id || p.id} 
                            product={p} 
                            onDelete={(id: any) => handleDelete(p._id || p.id as any)} 
                            onAddToCart={handleAddToCart} 
                            onToggleWishlist={handleToggleWishlist} 
                            isWishlisted={wishlist.some(w => w._id === p._id)} 
                            isDark={isDark} 
                            isAdmin={isAdmin} 
                        />
                    ))
                ) : (
                    !loading && <div className="col-span-full text-center py-20 opacity-50 font-mono text-xl">ไม่พบสินค้าที่คุณค้นหา...</div>
                )}
            </motion.div>
        </AnimatePresence>
      </div>
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} onRemove={handleRemoveFromCart} isDark={isDark} onCheckout={handleCheckout} />
      
      <div className={`fixed bottom-0 left-0 w-full h-8 border-t backdrop-blur flex items-center justify-between px-6 text-[10px] font-mono pointer-events-none z-20 transition-colors duration-500 ${isDark ? 'bg-black/80 border-white/10 text-gray-500' : 'bg-white/80 border-blue-900/10 text-slate-400'}`}>
          <span>สถานะ: ออนไลน์</span>
          <span>โหมด: {isAdmin ? 'แอดมิน' : 'ลูกค้า'}</span>
          <span>VER 9.5 SPECLIAL_GRADE_READY</span>
      </div>
    </div>
  );
} 