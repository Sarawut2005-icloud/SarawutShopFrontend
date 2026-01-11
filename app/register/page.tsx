'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

// ── StarField (เหมือนหน้า main & login เป๊ะ) ──────────────────────────────
const StarField = ({ isDark }: { isDark: boolean }) => {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((_, delta) => {
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

// ── Main Register Page ──────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('theme-preference');
    setIsDark(saved !== 'light');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:3001/auth/register', formData);

      setSuccess('สร้างตัวตนใหม่สำเร็จ! กำลังพาคุณไปล็อกอิน...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'SYSTEM ERROR: Registration failed - email may already exist'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-mono ${isDark ? 'bg-black text-white' : 'bg-[#f0f4f8] text-slate-900'}`}>
      {/* Background + StarField */}
      <Background isDark={isDark} />

      {/* Grid overlay */}
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
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={`w-full max-w-lg md:max-w-xl p-8 md:p-12 rounded-3xl backdrop-blur-xl border shadow-[0_0_70px_rgba(0,255,255,0.18)] overflow-hidden
            ${isDark ? 'bg-black/65 border-cyan-500/35' : 'bg-white/75 border-blue-400/45 shadow-blue-500/25'}`}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              NEW IDENTITY
            </h1>
            <p className="text-xs md:text-sm font-mono opacity-60 mt-3 tracking-[0.4em]">
              // CREATE NEW OPERATOR // LEVEL 1 CLEARANCE INITIATED
            </p>
          </div>

          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-5 rounded-xl bg-red-950/45 border border-red-500/50 text-red-300 text-sm font-mono text-center shadow-[0_0_25px_rgba(239,68,68,0.35)]"
              >
                ⚠ {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-5 rounded-xl bg-green-950/45 border border-green-500/50 text-green-300 text-sm font-mono text-center shadow-[0_0_25px_rgba(34,197,94,0.35)]"
              >
                ✓ {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-7">
            <div>
              <label className={`block text-xs font-bold tracking-widest mb-2 uppercase ${isDark ? 'text-cyan-400/80' : 'text-blue-600/80'}`}>
                FULL IDENTITY NAME
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-5 py-4 rounded-xl bg-transparent border outline-none transition-all duration-300 text-lg tracking-wide
                  ${isDark ? 'border-white/20 focus:border-cyan-500 focus:bg-white/5 text-white placeholder-cyan-700' : 'border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-500'}`}
                placeholder="Commander Sarawut"
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-bold tracking-widest mb-2 uppercase ${isDark ? 'text-cyan-400/80' : 'text-blue-600/80'}`}>
                EMAIL IDENTIFIER
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-5 py-4 rounded-xl bg-transparent border outline-none transition-all duration-300 text-lg tracking-wide
                  ${isDark ? 'border-white/20 focus:border-cyan-500 focus:bg-white/5 text-white placeholder-cyan-700' : 'border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-500'}`}
                placeholder="newoperator@domain.com"
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-bold tracking-widest mb-2 uppercase ${isDark ? 'text-cyan-400/80' : 'text-blue-600/80'}`}>
                INITIAL ACCESS KEY
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-5 py-4 rounded-xl bg-transparent border outline-none transition-all duration-300 text-lg tracking-wide
                  ${isDark ? 'border-white/20 focus:border-cyan-500 focus:bg-white/5 text-white placeholder-cyan-700' : 'border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-500'}`}
                placeholder="•••••••••••• (min 6 chars)"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-xl font-black text-lg tracking-[0.2em] transition-all duration-300 shadow-lg hover:shadow-[0_0_50px_rgba(0,255,255,0.4)]
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
                  CREATING NEW IDENTITY...
                </span>
              ) : (
                'CREATE IDENTITY →'
              )}
            </button>
          </form>

          {/* Link กลับไป Login */}
          <p className="text-center mt-10 text-sm opacity-70 tracking-wide">
            ALREADY HAVE CLEARANCE?{' '}
            <Link 
              href="/login" 
              className={`font-bold hover:underline transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-500'}`}
            >
              RETURN TO ACCESS GATE →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}