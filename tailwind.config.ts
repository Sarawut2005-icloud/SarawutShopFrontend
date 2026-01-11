import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // --- 👇 ส่วนที่เพิ่มเข้ามาใหม่ (เริ่ม) 👇 ---
      animation: {
        'shimmer-x': 'shimmer-x 1.5s infinite',
        'shimmer-x-reverse': 'shimmer-x-reverse 1.5s infinite',
        'progress': 'progress 2s ease-in-out infinite', // เพิ่มอันนี้เผื่อ Loading bar
      },
      keyframes: {
        'shimmer-x': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'shimmer-x-reverse': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'progress': {
            '0%': { width: '0%', marginLeft: '0%' },
            '50%': { width: '50%', marginLeft: '25%' },
            '100%': { width: '0%', marginLeft: '100%' }
        }
      },
      // --- 👆 ส่วนที่เพิ่มเข้ามาใหม่ (จบ) 👆 ---

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;