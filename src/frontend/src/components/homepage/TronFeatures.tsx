import React from 'react';
import { MapPin, Lock, Cpu, Network, Eye, Gamepad2 } from 'lucide-react';

export function TronFeatures() {
  const features = [
    {
      icon: Lock,
      title: "Privacy-First Gaming",
      description: "Your exact location remains secret while proving you're in the safe zone",
      color: "cyan"
    },
    {
      icon: Cpu,
      title: "ZK Technology",
      description: "Cutting-edge zero-knowledge proofs protect your competitive advantage",
      color: "orange"
    },
    {
      icon: Network,
      title: "Decentralized Verification",
      description: "No central authority can track or store your location data",
      color: "cyan"
    },
    {
      icon: MapPin,
      title: "H3 Spatial Indexing",
      description: "Uber's hexagonal hierarchical spatial index for precise zone detection",
      color: "orange"
    },
    {
      icon: Eye,
      title: "Strategic Gameplay",
      description: "Hide your position from opponents while staying in the safe zone",
      color: "cyan"
    },
    {
      icon: Gamepad2,
      title: "Real-Time Action",
      description: "Instant proof generation and verification for seamless gameplay",
      color: "orange"
    }
  ];

  return (
    <section className="py-20 px-4 bg-black/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="tron-neon-cyan">ENTER THE GRID</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of location-based gaming with zero-knowledge technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isOrange = feature.color === "orange";
            
            return (
              <div 
                key={index}
                className="tron-card group hover:scale-105 transition-transform duration-300"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className={`mb-4 ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`}>
                  <Icon className="w-10 h-10" />
                </div>
                
                <h3 className={`text-xl font-semibold mb-3 ${
                  isOrange ? 'text-orange-300' : 'text-cyan-300'
                }`}>
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className={`mt-4 h-0.5 w-full ${
                  isOrange ? 'bg-orange-500/30' : 'bg-cyan-500/30'
                } group-hover:bg-opacity-60 transition-all`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}