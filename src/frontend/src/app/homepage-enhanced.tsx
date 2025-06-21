"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  Map, 
  Users, 
  Globe, 
  Lock,
  ChevronRight,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  Play,
  Gamepad2,
  Menu,
  X
} from 'lucide-react';
import { useScrollAnimation, useParallax, useScrollProgress } from '../hooks/useScrollAnimations';
import '../styles/tron-design-system.css';

export default function EnhancedTronHomepage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Parallax offsets for different layers
  const bgLayer1Offset = useParallax(0.3);
  const bgLayer2Offset = useParallax(0.5);
  const bgLayer3Offset = useParallax(0.7);
  const scrollProgress = useScrollProgress();

  // Scroll animations refs
  const [heroRef, heroVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [featuresRef, featuresVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [gameplayRef, gameplayVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [techRef, techVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [ctaRef, ctaVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-orange-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Parallax Background Layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="parallax-layer parallax-bg-1"
          style={{ transform: `translateY(${bgLayer1Offset}px)` }}
        />
        <div 
          className="parallax-layer parallax-bg-2"
          style={{ transform: `translateY(${bgLayer2Offset}px)` }}
        />
        <div 
          className="parallax-layer parallax-bg-3"
          style={{ transform: `translateY(${bgLayer3Offset}px)` }}
        />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      {/* Digital Rain Background */}
      {mounted && (
        <div className="digital-rain" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="rain-column"
              style={{
                left: `${i * 5}%`,
                animationDuration: `${10 + (i % 10)}s`,
                animationDelay: `${i * 0.25}s`
              }}
            >
              {[...Array(30)].map((_, j) => (
                <div key={j}>{((i + j) % 2) === 0 ? '1' : '0'}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Navigation with Scroll Effects */}
      <nav className={`nav-tron fixed w-full z-40 transition-all duration-300 ${
        scrollY > 50 ? 'backdrop-blur-xl bg-black/50' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold heading-glow" data-text="ZK SHROUD">
                ZK SHROUD
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="nav-link-tron">Features</a>
              <a href="#gameplay" className="nav-link-tron">Gameplay</a>
              <a href="#technology" className="nav-link-tron">Technology</a>
              <a href="/proof-demo" className="nav-link-tron">Demo</a>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="btn-tron btn-tron-primary hidden md:block">
                Enter Arena
              </button>
              
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden text-cyan-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-cyan-400/20">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block nav-link-tron">Features</a>
              <a href="#gameplay" className="block nav-link-tron">Gameplay</a>
              <a href="#technology" className="block nav-link-tron">Technology</a>
              <a href="/proof-demo" className="block nav-link-tron">Demo</a>
              <button className="btn-tron btn-tron-primary w-full">
                Enter Arena
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Enhanced Animations */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center tron-grid pt-32">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="space-y-8">
            {/* ZKHack Berlin Badge */}
            <div className={`inline-flex items-center justify-center mb-8 relative z-20 ${heroVisible ? 'animate-in' : ''} fade-in-up`}>
              <div className="relative group">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 -inset-x-8 -inset-y-4 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(to right, #FF69B4 1px, transparent 1px),
                      linear-gradient(to bottom, #FF69B4 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent rounded blur-xl" />
                
                {/* Main Badge */}
                <div className="relative border border-pink-500/30 rounded px-8 py-3 backdrop-blur-sm bg-black/80 group-hover:border-pink-500/50 transition-all duration-300">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs tracking-wider text-gray-400 mb-1">POWERED BY</div>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-2xl font-orbitron" style={{ 
                        letterSpacing: '0.15em',
                        color: 'transparent',
                        WebkitTextStroke: '1px #00D9FF',
                        textShadow: '0 0 20px rgba(0, 217, 255, 0.5)'
                      }}>ZK</span>
                      <span className="text-2xl font-orbitron" style={{ 
                        letterSpacing: '0.15em',
                        color: 'transparent',
                        WebkitTextStroke: '1px #00D9FF',
                        textShadow: '0 0 20px rgba(0, 217, 255, 0.5)'
                      }}>HACK</span>
                      <span className="text-2xl font-orbitron text-pink-400" style={{ 
                        letterSpacing: '0.15em',
                        textShadow: '0 0 20px rgba(255, 105, 180, 0.8)'
                      }}>BERLIN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated Title */}
            <h1 className={`heading-hero mb-4 ${heroVisible ? 'animate-in' : ''} fade-in-up stagger-1`}>
              <span className="block">ENTER THE</span>
              <span className="block glitch-text">ZERO KNOWLEDGE</span>
              <span className="block">BATTLEGROUND</span>
            </h1>
            
            <p className={`text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 ${
              heroVisible ? 'animate-in' : ''
            } fade-in-up stagger-2`}>
              A revolutionary battle royale where your location is protected by 
              <span className="text-cyan-400 font-semibold"> cryptographic proofs</span> and 
              zones are controlled by <span className="text-orange-500 font-semibold">human game masters</span>
            </p>

            {/* CTA Buttons with Stagger */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${
              heroVisible ? 'animate-in' : ''
            } fade-in-up stagger-3`}>
              <a href="/gm" className="btn-tron btn-tron-primary group float-animation">
                <span className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Play as Game Master
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
              <a href="/player" className="btn-tron btn-tron-secondary group">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Join as Player
                  <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            </div>

            {/* Animated Live Stats */}
            <div className={`mt-16 flex flex-wrap justify-center gap-4 md:gap-8 ${
              heroVisible ? 'animate-in' : ''
            }`}>
              <div className="glass-panel px-6 py-3 scale-in stagger-4">
                <div className="text-cyan-400 text-sm">Players Online</div>
                <div className="text-2xl font-bold">1,337</div>
              </div>
              <div className="glass-panel px-6 py-3 scale-in stagger-5">
                <div className="text-orange-500 text-sm">Active Zones</div>
                <div className="text-2xl font-bold">42</div>
              </div>
              <div className="glass-panel px-6 py-3 scale-in stagger-6">
                <div className="text-green-400 text-sm">Proofs Generated</div>
                <div className="text-2xl font-bold">10.2K</div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Circuit Lines */}
        <div className="circuit-lines">
          <div 
            className="circuit-line"
            style={{
              width: '300px',
              top: '20%',
              left: '-300px',
              animation: 'circuit-move-right 5s linear infinite'
            }}
          />
          <div 
            className="circuit-line"
            style={{
              width: '400px',
              bottom: '30%',
              right: '-400px',
              animation: 'circuit-move-left 7s linear infinite'
            }}
          />
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-500 ${
          scrollY > 50 ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <a href="#features" className="group">
            <div className="text-center text-gray-400 text-sm mb-2 group-hover:text-cyan-400 transition-colors">
              Scroll Down
            </div>
            <div className="relative">
              <div className="w-6 h-10 border-2 border-gray-600 group-hover:border-cyan-400 rounded-full transition-colors">
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gray-400 group-hover:bg-cyan-400 rounded-full transition-colors"
                  style={{
                    animation: 'scroll-indicator 2s infinite',
                    top: '8px'
                  }}
                />
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Features Section - Enhanced Bento Box Layout */}
      <section ref={featuresRef} id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 ${featuresVisible ? 'animate-in' : ''} fade-in-up`}>
            <h2 className="text-4xl font-bold mb-4 heading-glow" data-text="REVOLUTIONARY FEATURES">
              REVOLUTIONARY FEATURES
            </h2>
            <p className="text-xl text-gray-400">
              Experience the future of competitive gaming
            </p>
          </div>

          {/* Enhanced Bento Grid with Staggered Animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large Feature Card */}
            <div className={`md:col-span-2 lg:col-span-2 row-span-2 card-tron group ${
              featuresVisible ? 'animate-in' : ''
            } stagger-in stagger-1`}>
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 float-animation">
                    <Shield className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Zero-Knowledge Location Proofs</h3>
                </div>
                <p className="text-gray-300 mb-6 flex-grow">
                  Your exact position remains completely private. The game only knows if you're 
                  inside or outside zones through cryptographic proofs, ensuring true location privacy.
                </p>
                <div className="p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                  <div className="font-mono text-sm text-cyan-400 mb-2">// Proof Generation</div>
                  <code className="text-xs text-gray-300">
                    generateProof(location, zone) → zkSNARK
                  </code>
                </div>
              </div>
            </div>

            {/* Medium Feature Cards with Stagger */}
            <div className={`card-tron group ${featuresVisible ? 'animate-in' : ''} stagger-in stagger-2`}>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 inline-block mb-4">
                <Gamepad2 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Human-Controlled Zones</h3>
              <p className="text-gray-300 text-sm">
                No predictable shrinking circles. Game Masters create dynamic battlefields in real-time.
              </p>
            </div>

            <div className={`card-tron group ${featuresVisible ? 'animate-in' : ''} stagger-in stagger-3`}>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 inline-block mb-4">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-World Integration</h3>
              <p className="text-gray-300 text-sm">
                Play in virtual arenas or use your actual GPS location for immersive gameplay.
              </p>
            </div>

            <div className={`card-tron group ${featuresVisible ? 'animate-in' : ''} stagger-in stagger-4`}>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 inline-block mb-4">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Zone Updates</h3>
              <p className="text-gray-300 text-sm">
                Zones can appear, disappear, or transform instantly based on GM decisions.
              </p>
            </div>

            <div className={`card-tron group ${featuresVisible ? 'animate-in' : ''} stagger-in stagger-5`}>
              <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 inline-block mb-4">
                <Activity className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Strategic Gameplay</h3>
              <p className="text-gray-300 text-sm">
                Adapt to unpredictable challenges and outsmart both players and the Game Master.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section with Parallax */}
      <section ref={gameplayRef} id="gameplay" className="py-20 px-6 relative">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="tron-grid h-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Interactive Demo */}
            <div className={`relative ${gameplayVisible ? 'animate-in' : ''} fade-in-left`}>
              <div className="glass-panel p-8 relative overflow-hidden">
                <h3 className="text-2xl font-bold mb-6 neon-glow-cyan">
                  Live Zone Demonstration
                </h3>
                
                {/* Enhanced Mini Map Demo */}
                <div className="relative h-96 bg-circuit-dark rounded-lg overflow-hidden">
                  <div className="absolute inset-0 tron-grid opacity-30" />
                  
                  {/* Animated Zones */}
                  <div 
                    className="absolute w-32 h-32 rounded-full border-2 border-cyan-400"
                    style={{
                      top: '20%',
                      left: '30%',
                      boxShadow: '0 0 30px rgba(0, 217, 255, 0.5)',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                  <div 
                    className="absolute w-24 h-24 rounded-full border-2 border-orange-500"
                    style={{
                      bottom: '25%',
                      right: '20%',
                      boxShadow: '0 0 30px rgba(255, 107, 26, 0.5)',
                      animation: 'pulse 2s infinite 0.5s'
                    }}
                  />
                  
                  {/* Player Indicators */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                    <div className="text-xs text-green-400 mt-1">You</div>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-4">
                  <a href="/gm" className="btn-tron btn-tron-secondary flex-1">
                    Try as GM
                  </a>
                  <a href="/player" className="btn-tron btn-tron-primary flex-1">
                    Try as Player
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Feature Rotation */}
            <div className={`space-y-6 ${gameplayVisible ? 'animate-in' : ''} fade-in-right`}>
              <h2 className="text-4xl font-bold heading-glow" data-text="GAME MODES">
                GAME MODES
              </h2>
              
              <div 
                className={`card-tron transition-all cursor-pointer ${
                  activeFeature === 0 ? 'neon-border' : ''
                } ${gameplayVisible ? 'animate-in' : ''} stagger-in stagger-1`}
                onClick={() => setActiveFeature(0)}
                onMouseEnter={() => setActiveFeature(0)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Battle Royale</h3>
                    <p className="text-gray-400 text-sm">Classic last-player-standing with unpredictable zone mechanics</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ml-auto transition-transform ${
                    activeFeature === 0 ? 'translate-x-2' : ''
                  }`} />
                </div>
              </div>

              <div 
                className={`card-tron transition-all cursor-pointer ${
                  activeFeature === 1 ? 'neon-border' : ''
                } ${gameplayVisible ? 'animate-in' : ''} stagger-in stagger-2`}
                onClick={() => setActiveFeature(1)}
                onMouseEnter={() => setActiveFeature(1)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <Map className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Zone Control</h3>
                    <p className="text-gray-400 text-sm">Capture and hold strategic zones while staying hidden</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ml-auto transition-transform ${
                    activeFeature === 1 ? 'translate-x-2' : ''
                  }`} />
                </div>
              </div>

              <div 
                className={`card-tron transition-all cursor-pointer ${
                  activeFeature === 2 ? 'neon-border' : ''
                } ${gameplayVisible ? 'animate-in' : ''} stagger-in stagger-3`}
                onClick={() => setActiveFeature(2)}
                onMouseEnter={() => setActiveFeature(2)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <Cpu className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Stealth Ops</h3>
                    <p className="text-gray-400 text-sm">Complete objectives without revealing your true location</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ml-auto transition-transform ${
                    activeFeature === 2 ? 'translate-x-2' : ''
                  }`} />
                </div>
              </div>

              <div 
                className={`card-tron transition-all cursor-pointer ${
                  activeFeature === 3 ? 'neon-border' : ''
                } ${gameplayVisible ? 'animate-in' : ''} stagger-in stagger-4`}
                onClick={() => setActiveFeature(3)}
                onMouseEnter={() => setActiveFeature(3)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Layers className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Multi-Layer</h3>
                    <p className="text-gray-400 text-sm">Navigate through overlapping zones with different properties</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ml-auto transition-transform ${
                    activeFeature === 3 ? 'translate-x-2' : ''
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section with 3D Transforms */}
      <section ref={techRef} id="technology" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className={`text-4xl font-bold mb-16 heading-glow ${
            techVisible ? 'animate-in' : ''
          } fade-in-up`} data-text="POWERED BY">
            POWERED BY
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              className={`glass-panel p-8 group hover:scale-105 transition-all duration-500 ${
                techVisible ? 'animate-in' : ''
              } scale-in stagger-1`}
              style={{
                transform: techVisible ? `translateZ(0) rotateY(0)` : `translateZ(-100px) rotateY(15deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="text-6xl font-bold holographic mb-4 float-animation">ZK</div>
              <h3 className="text-xl font-bold mb-2">Zero-Knowledge Proofs</h3>
              <p className="text-gray-400">Cryptographic privacy protection</p>
            </div>

            <div 
              className={`glass-panel p-8 group hover:scale-105 transition-all duration-500 ${
                techVisible ? 'animate-in' : ''
              } scale-in stagger-2`}
              style={{
                transform: techVisible ? `translateZ(0) rotateY(0)` : `translateZ(-100px) rotateY(15deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="text-6xl font-bold holographic mb-4 float-animation">H3</div>
              <h3 className="text-xl font-bold mb-2">Uber H3 Hexagons</h3>
              <p className="text-gray-400">Precise geospatial indexing</p>
            </div>

            <div 
              className={`glass-panel p-8 group hover:scale-105 transition-all duration-500 ${
                techVisible ? 'animate-in' : ''
              } scale-in stagger-3`}
              style={{
                transform: techVisible ? `translateZ(0) rotateY(0)` : `translateZ(-100px) rotateY(15deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="text-6xl font-bold holographic mb-4 float-animation">RT</div>
              <h3 className="text-xl font-bold mb-2">Real-Time Sync</h3>
              <p className="text-gray-400">Instant zone updates via WebSocket</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Dramatic Effects */}
      <section ref={ctaRef} className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
        
        {/* Animated Background Shapes */}
        <div 
          className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl float-animation"
        />
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl float-animation"
          style={{ animationDelay: '-2s' }}
        />
        
        <div className={`max-w-4xl mx-auto text-center relative z-10 ${
          ctaVisible ? 'animate-in' : ''
        }`}>
          <h2 className="text-5xl font-bold mb-6 fade-in-up">
            <span className="neon-glow-cyan">READY TO</span>{' '}
            <span className="neon-glow-orange">ENTER THE GRID?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 fade-in-up stagger-1">
            Join the revolution in competitive gaming where privacy meets strategy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up stagger-2">
            <a href="/proof-demo" className="btn-tron btn-tron-primary text-lg px-8 py-4 group">
              <span className="flex items-center gap-3">
                <Lock className="w-6 h-6" />
                Try ZK Proof Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span className="font-bold">ZK SHROUD ARENA</span>
          </div>
          <p className="text-gray-400 text-sm">
            Built for <span className="text-pink-400">ZKHack Berlin 2025</span> • Powered by Zero-Knowledge Cryptography
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes circuit-move-right {
          from { transform: translateX(0); }
          to { transform: translateX(calc(100vw + 300px)); }
        }
        
        @keyframes circuit-move-left {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100vw - 400px)); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        
        @keyframes scroll-indicator {
          0% {
            top: 8px;
            opacity: 1;
          }
          50% {
            top: 20px;
            opacity: 0.5;
          }
          100% {
            top: 8px;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}