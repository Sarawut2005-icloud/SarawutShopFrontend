'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three'; // ← เพิ่มบรรทัดนี้เพื่อใช้ type จริง (สำคัญมาก!)


// ── StarField (สไตล์เดียวกับหน้า main เป๊ะ + แก้ type ให้ถูกต้อง) ──────────────────────────────
const StarField = ({ isDark }: { isDark: boolean }) => {
  const ref = useRef<THREE.Points>(null); // ← แก้จาก any เป็น THREE.Points (type จริงของ <Points>)

  const [sphere] = useState(() => 
    random.inSphere(new Float32Array(5000), { radius: 1.5 })
  );

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 12;
      ref.current.rotation.y -= delta / 18;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={isDark ? "#ffa0e0" : "#2563eb"}
          size={0.0045}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={isDark ? 0.9 : 0.6}
        />
      </Points>
    </group>
  );
};

// ── Background (เหมือนหน้า main) ────────────────────────────────
const Background = ({ isDark }: { isDark: boolean }) => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <Canvas camera={{ position: [0, 0, 1.2] }}>
      <color attach="background" args={[isDark ? '#000000' : '#f0f4f8']} />
      <StarField isDark={isDark} />
    </Canvas>
  </div>
);

// ── Main Login Page ──────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('theme-preference');
    setIsDark(saved !== 'light');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:3001/auth/login', {
        email,
        password,
      });

      const { access_token } = res.data;

      localStorage.setItem('access_token', access_token);

      // Decode JWT payload เพื่อดึง role (วิธีชั่วคราวสำหรับ dev)
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      const role = payload.role || 'user';

      localStorage.setItem('userRole', role);
      localStorage.setItem('isAdminMode', role === 'admin' ? 'true' : 'false');
      localStorage.setItem('isLoggedIn', 'true');

      // แจ้งต้อนรับแบบ cyberpunk เทพ ๆ
      alert(
        role === 'admin'
          ? 'ยินดีต้อนรับ COMMANDER! SYSTEM ACCESS GRANTED 🔐'
          : `ACCESS GRANTED - Welcome Operator ${email.split('@')[0]} ⚡️`
      );

      router.push('/product');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'SYSTEM ERROR: Invalid credentials or server unreachable'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-mono ${isDark ? 'bg-black text-white' : 'bg-[#f0f4f8] text-slate-900'}`}>
      {/* Background + StarField เหมือนหน้า main เป๊ะ */}
      <Background isDark={isDark} />

      {/* Grid overlay สไตล์ cyber */}
      <div
        className={`fixed inset-0 z-0 pointer-events-none bg-[size:24px_24px] ${
          isDark
            ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]'
        }`}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`w-full max-w-lg md:max-w-xl p-8 md:p-12 rounded-3xl backdrop-blur-xl border shadow-[0_0_60px_rgba(0,255,255,0.15)] overflow-hidden
            ${isDark ? 'bg-black/60 border-cyan-500/30' : 'bg-white/70 border-blue-400/40 shadow-blue-500/20'}`}
        >
          {/* Header สไตล์เทพ cyberpunk */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              ACCESS GATE
            </h1>
            <p className="text-xs md:text-sm font-mono opacity-60 mt-3 tracking-[0.4em]">
              // AUTHENTICATION REQUIRED // LEVEL 9 CLEARANCE REQUIRED
            </p>
          </div>

          {/* Error แสดงแบบเท่ ๆ */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-sm font-mono text-center shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                ⚠ SYSTEM ALERT: {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form สไตล์ cyber */}
          <form onSubmit={handleLogin} className="space-y-7">
            <div>
              <label className={`block text-xs font-bold tracking-widest mb-2 uppercase ${isDark ? 'text-cyan-400/80' : 'text-blue-600/80'}`}>
                EMAIL / IDENTIFIER
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className={`w-full px-5 py-4 rounded-xl bg-transparent border outline-none transition-all duration-300 text-lg tracking-wide
                  ${isDark ? 'border-white/20 focus:border-cyan-500 focus:bg-white/5 text-white placeholder-cyan-700' : 'border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-500'}`}
                placeholder="operator@domain.com"
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-bold tracking-widest mb-2 uppercase ${isDark ? 'text-cyan-400/80' : 'text-blue-600/80'}`}>
                ACCESS KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl bg-transparent border outline-none transition-all duration-300 text-lg tracking-wide
                  ${isDark ? 'border-white/20 focus:border-cyan-500 focus:bg-white/5 text-white placeholder-cyan-700' : 'border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-500'}`}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-xl font-black text-lg tracking-[0.2em] transition-all duration-300 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_50px_rgba(0,255,255,0.4)]
                ${isDark
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-black'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white'}
                ${loading ? 'opacity-60 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  >
                    ⟳
                  </motion.span>
                  AUTHORIZING SYSTEM...
                </span>
              ) : (
                'INITIATE ACCESS →'
              )}
            </button>
          </form>

          {/* Divider สไตล์ cyber */}
          <div className="my-10 flex items-center gap-6">
            <div className={`flex-1 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent'}`}></div>
            <span className="text-xs opacity-50 font-mono tracking-widest">SECURE ALTERNATIVE PROTOCOL</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent'}`}></div>
          </div>

          {/* Facebook Button สไตล์เทพ */}
          <button
            onClick={() => alert('Facebook OAuth integration (coming soon)')}
            className="w-full py-5 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-[#1877F2] to-[#0e5a8a] hover:from-[#166FE5] hover:to-[#0c4a75] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(24,119,242,0.4)] hover:shadow-[0_0_50px_rgba(24,119,242,0.6)]"
          >
            <span className="text-3xl font-black">f</span>
            CONTINUE WITH FACEBOOK
          </button>

          {/* Register Link */}
          <p className="text-center mt-10 text-sm opacity-70 tracking-wide">
            NEW TO THE SYSTEM?{' '}
            <Link 
              href="/register" 
              className={`font-bold hover:underline transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-500'}`}
            >
              REGISTER NEW IDENTITY →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}