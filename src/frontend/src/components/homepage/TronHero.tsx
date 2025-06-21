import React, { useEffect, useState } from 'react';
import { Shield, Globe, Users, Zap } from 'lucide-react';

export function TronHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen tron-grid-bg overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className={`max-w-6xl mx-auto text-center ${isVisible ? 'tron-animate-in' : 'opacity-0'}`}>
          {/* Title with Glitch Effect */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 relative">
            <span className="tron-glitch tron-neon-cyan" data-text="ZK SHROUD">
              ZK SHROUD
            </span>
            <br />
            <span className="text-4xl md:text-5xl tron-neon-orange">
              ARENA
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Enter the Grid. Prove Your Position. Keep Your Location Secret.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="tron-card group">
              <div className="flex justify-center mb-4">
                <Shield className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-cyan-300">Zero-Knowledge Proofs</h3>
              <p className="text-sm text-gray-400">
                Verify your location without revealing it. True privacy in the digital arena.
              </p>
            </div>

            <div className="tron-card group">
              <div className="flex justify-center mb-4">
                <Globe className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-cyan-300">Real-World Integration</h3>
              <p className="text-sm text-gray-400">
                Battle in virtual arenas or use real GPS locations. The choice is yours.
              </p>
            </div>

            <div className="tron-card group">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-cyan-300">Dynamic Gameplay</h3>
              <p className="text-sm text-gray-400">
                Human-controlled zones create unpredictable, strategic battlefields.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => window.location.href = '/gm'}
              className="tron-button min-w-[200px] group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Enter as Game Master
              </span>
            </button>

            <button 
              onClick={() => window.location.href = '/player'}
              className="tron-button tron-button-orange min-w-[200px] group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Enter as Player
              </span>
            </button>
          </div>

          {/* Circuit decoration */}
          <div className="mt-16 tron-circuit h-1 w-full max-w-md mx-auto" />
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none tron-scanline" />
    </section>
  );
}