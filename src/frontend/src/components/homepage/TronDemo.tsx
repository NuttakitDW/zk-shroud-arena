import React, { useState } from 'react';
import { Play, Code, Shield, ArrowRight } from 'lucide-react';

export function TronDemo() {
  const [activeDemo, setActiveDemo] = useState<'proof' | 'game' | null>(null);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 tron-grid-bg" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="tron-neon-orange">EXPERIENCE THE FUTURE</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Try our interactive demos to see zero-knowledge proofs in action
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ZK Proof Demo Card */}
          <div 
            className="tron-card cursor-pointer group"
            onClick={() => window.location.href = '/proof-demo'}
            onMouseEnter={() => setActiveDemo('proof')}
            onMouseLeave={() => setActiveDemo(null)}
          >
            <div className="flex items-start justify-between mb-4">
              <Shield className="w-12 h-12 text-cyan-400" />
              <ArrowRight className={`w-6 h-6 text-cyan-400 transition-transform ${
                activeDemo === 'proof' ? 'translate-x-2' : ''
              }`} />
            </div>
            
            <h3 className="text-2xl font-semibold mb-3 text-cyan-300">
              ZK Proof Playground
            </h3>
            
            <p className="text-gray-400 mb-6">
              Draw H3 hexagonal zones on an interactive map and generate real zero-knowledge proofs. 
              See the cryptographic magic happen in real-time.
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Code className="w-4 h-4" />
                <span>Real ZK proof generation</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Play className="w-4 h-4" />
                <span>Interactive H3 zone drawing</span>
              </div>
            </div>

            <div className={`mt-6 h-1 w-full bg-gradient-to-r from-cyan-500/20 to-cyan-500/60 transition-all duration-300 ${
              activeDemo === 'proof' ? 'opacity-100' : 'opacity-0'
            }`} />
          </div>

          {/* Game Demo Card */}
          <div 
            className="tron-card cursor-pointer group"
            onClick={() => window.location.href = '/player'}
            onMouseEnter={() => setActiveDemo('game')}
            onMouseLeave={() => setActiveDemo(null)}
          >
            <div className="flex items-start justify-between mb-4">
              <Play className="w-12 h-12 text-orange-400" />
              <ArrowRight className={`w-6 h-6 text-orange-400 transition-transform ${
                activeDemo === 'game' ? 'translate-x-2' : ''
              }`} />
            </div>
            
            <h3 className="text-2xl font-semibold mb-3 text-orange-300">
              Live Game Demo
            </h3>
            
            <p className="text-gray-400 mb-6">
              Jump into a live battle royale match. Experience dynamic zones controlled by Game Masters 
              and privacy-preserving location verification.
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Play className="w-4 h-4" />
                <span>Real-time multiplayer</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Location privacy protection</span>
              </div>
            </div>

            <div className={`mt-6 h-1 w-full bg-gradient-to-r from-orange-500/20 to-orange-500/60 transition-all duration-300 ${
              activeDemo === 'game' ? 'opacity-100' : 'opacity-0'
            }`} />
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Ready to build with ZK technology?</p>
          <button 
            className="tron-button"
            onClick={() => window.open('https://github.com/your-repo', '_blank')}
          >
            View on GitHub
          </button>
        </div>
      </div>
    </section>
  );
}