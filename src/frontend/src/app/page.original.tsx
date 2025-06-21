"use client";

import React from 'react';
import { TronHero, TronFeatures, TronNav, TronDemo } from '../components/homepage';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <TronNav />
      <TronHero />
      <TronFeatures />
      <TronDemo />
      
      {/* Footer */}
      <footer className="relative z-10 bg-black/80 border-t border-cyan-500/20 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">About ZK Shroud</h3>
              <p className="text-gray-400 text-sm">
                Revolutionary battle royale gaming with zero-knowledge location proofs. 
                Your position stays private while gameplay remains fair.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/gm" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Game Master Mode
                  </a>
                </li>
                <li>
                  <a href="/player" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Player Mode
                  </a>
                </li>
                <li>
                  <a href="/proof-demo" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    ZK Proof Demo
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Tech Stack */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Technology</h3>
              <p className="text-gray-400 text-sm mb-2">
                Built for ZKHack 2025
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Zero-Knowledge
                </span>
                <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  H3 Spatial Index
                </span>
                <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  React/Next.js
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-cyan-500/20 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 ZK Shroud Arena. Enter the Grid. Protect Your Position.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}