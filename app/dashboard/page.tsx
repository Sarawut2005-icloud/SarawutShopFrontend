'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

// --- 🌌 3D Background ---
const StarField = memo(({ isDark }: { isDark: boolean }) => {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta / 15; ref.current.rotation.y -= delta / 20; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={isDark ? "#00ffcc" : "#2563eb"} size={0.005} sizeAttenuation={true} depthWrite={false} opacity={isDark ? 1 : 0.6} />
      </Points>
    </group>
  );
});

const BackgroundCanvas = memo(({ isDark }: { isDark: boolean }) => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <Canvas camera={{ position: [0, 0, 1] }}>
      <color attach="background" args={[isDark ? '#020205' : '#e2e8f0']} />
      <StarField isDark={isDark} />
    </Canvas>
  </div>
));

// --- 📊 Stat Card ---
const StatCard = ({ title, value, subtext, color, isDark }: any) => (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-blue-200 shadow-md'}`}>
        <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500/20 blur-3xl rounded-full group-hover:bg-${color}-500/40 transition-all`}></div>
        <h3 className={`text-xs font-mono tracking-widest mb-2 uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{title}</h3>
        <div className={`text-4xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</div>
        <div className={`text-[10px] font-bold ${color === 'red' ? 'text-red-500' : (color === 'green' ? 'text-green-500' : 'text-cyan-500')}`}>{subtext}</div>
    </motion.div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, outOfStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    // 1. Check Admin
    const isAdmin = localStorage.getItem('isAdminMode');
    if (isAdmin !== 'true') {
        alert('⛔ ACCESS DENIED: พื้นที่สำหรับผู้ดูแลระบบเท่านั้น');
        router.push('/product');
        return;
    }

    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    // 2. Fetch Data
    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:3001/products');
            const data = res.data;
            setProducts(data);

            const totalVal = data.reduce((acc: number, item: any) => acc + (item.price * (item.stock || 0)), 0);
            const lowStockItems = data.filter((item: any) => (item.stock || 0) < 5);
            const outOfStockItems = data.filter((item: any) => (item.stock || 0) === 0);

            setStats({
                totalItems: data.length,
                totalValue: totalVal,
                outOfStock: outOfStockItems.length
            });
            setLowStock(lowStockItems);

            const mockOrders = Array.from({ length: 5 }).map((_, i) => ({
                id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
                customer: ['Somchai', 'Alice', 'John Wick', 'Tony Stark', 'Steve'][i],
                amount: (Math.floor(Math.random() * 50000) + 1000).toLocaleString(),
                status: ['Completed', 'Pending', 'Shipping', 'Completed', 'Processing'][i],
                time: `${Math.floor(Math.random() * 60)} mins ago`
            }));
            setRecentOrders(mockOrders);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulse bg-black text-cyan-500">INITIALIZING DASHBOARD...</div>;

  return (
    <div className={`relative min-h-screen w-full font-sans transition-colors duration-700 p-6 md:p-12 ${isDark ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'}`}>
        <BackgroundCanvas isDark={isDark} />
        
        <div className="relative z-10 max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex justify-between items-end mb-10 border-b border-gray-700/30 pb-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2">Command Center</h1>
                    <p className="font-mono text-xs text-cyan-500 tracking-[0.3em]">// SYSTEM_STATUS: ONLINE</p>
                </div>
                <Link href="/product">
                    <button className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                        ← BACK TO STORE
                    </button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="TOTAL PRODUCTS" value={stats.totalItems} subtext="Items in database" color="cyan" isDark={isDark} />
                <StatCard title="INVENTORY VALUE" value={`฿${(stats.totalValue / 1000000).toFixed(2)}M`} subtext="Total asset value" color="purple" isDark={isDark} />
                <StatCard title="LOW STOCK ALERT" value={lowStock.length} subtext="Need restock ASAP" color="red" isDark={isDark} />
                <StatCard title="ACTIVE ORDERS" value="12" subtext="Processing now" color="green" isDark={isDark} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ⚠️ Low Stock Table */}
                <div className={`lg:col-span-2 rounded-2xl p-6 border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-blue-200 shadow-lg'}`}>
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-red-500">
                        <span>⚠️</span> CRITICAL INVENTORY
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`text-xs font-mono border-b ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                                    <th className="py-3 px-4">PRODUCT NAME</th>
                                    <th className="py-3 px-4">CATEGORY</th>
                                    <th className="py-3 px-4 text-right">PRICE</th>
                                    <th className="py-3 px-4 text-right">STOCK</th>
                                    <th className="py-3 px-4 text-center">ACTION</th>
                                </tr> 
                            </thead>
                            <tbody>
                                {lowStock.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 opacity-50">All stocks are good! ✅</td></tr>
                                ) : (
                                    lowStock.map((item) => (
                                        <tr key={item._id} className={`text-sm border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <td className="py-3 px-4 font-bold">{item.name}</td>
                                            <td className="py-3 px-4 text-xs opacity-70">{item.category}</td>
                                            <td className="py-3 px-4 text-right font-mono">฿{item.price.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right font-bold text-red-500">{item.stock || 0}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Link href={`/product/${item._id}`}>
                                                    <button className="text-[10px] px-3 py-1 rounded border border-white/20 hover:bg-white/20">MANAGE</button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🛒 Recent Orders */}
                <div className={`rounded-2xl p-6 border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-blue-200 shadow-lg'}`}>
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-cyan-500">
                        <span>📡</span> LIVE FEED
                    </h2>
                    <div className="space-y-4">
                        {recentOrders.map((order, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div>
                                    <div className="font-bold text-sm">{order.customer}</div>
                                    <div className="text-[10px] opacity-50 font-mono">{order.id} • {order.time}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-sm">฿{order.amount}</div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                                        order.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                                        order.status === 'Shipping' ? 'bg-blue-500/20 text-blue-500' :
                                        'bg-yellow-500/20 text-yellow-500'
                                    }`}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}