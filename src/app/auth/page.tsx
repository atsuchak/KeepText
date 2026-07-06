"use client";

import { AuthForms } from "@/components/auth/AuthForms";
import { useEffect, useState, Suspense } from "react";

export default function AuthPage() {
  const [mousePosition, setMousePosition] = useState({ x: 500, y: 500 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
      {/* Dynamic Cursor Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(74, 222, 128, 0.08), transparent 80%)`
        }}
      />

      {/* Decorative ambient elements (optional, subtle) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-900/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<div className="text-white text-center p-8">Loading...</div>}>
          <AuthForms />
        </Suspense>
      </div>
    </div>
  );
}
