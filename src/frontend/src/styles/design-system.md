# ZK Shroud Arena Design System
## MetaMask x Tron Visual Language

### Color Palette

#### Primary Colors (Tron-inspired)
- **Neon Cyan**: `#00D9FF` - Primary accent, circuit lines
- **Electric Blue**: `#0096DB` - Secondary blue, hover states
- **Deep Blue**: `#003C5C` - Dark blue backgrounds
- **Orange Glow**: `#FF6B1A` - Alert, enemy indicators
- **Dark Orange**: `#CC4400` - Secondary orange accent

#### Background Colors
- **Pure Black**: `#000000` - Main background (Tron motto: "When in doubt, black it out")
- **Grid Black**: `#0A0A0A` - Slightly lighter black
- **Dark Glass**: `rgba(10, 14, 20, 0.8)` - Glassmorphic panels
- **Circuit Dark**: `#050810` - Deep blue-black

#### Neutral Colors
- **White**: `#FFFFFF` - Primary text
- **Light Gray**: `#E5E5E5` - Secondary text
- **Medium Gray**: `#999999` - Disabled states
- **Dark Gray**: `#333333` - Borders

### Typography

#### Font Stack
```css
--font-primary: 'Orbitron', 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

#### Type Scale
- **Hero**: 72px / 80px (4.5rem / 5rem)
- **H1**: 48px / 56px (3rem / 3.5rem)
- **H2**: 36px / 44px (2.25rem / 2.75rem)
- **H3**: 24px / 32px (1.5rem / 2rem)
- **Body**: 16px / 24px (1rem / 1.5rem)
- **Small**: 14px / 20px (0.875rem / 1.25rem)

### Visual Effects

#### Glassmorphism (MetaMask-inspired)
```css
.glass-panel {
  background: rgba(10, 14, 20, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 217, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 217, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

#### Neon Glow Effects
```css
.neon-glow-cyan {
  box-shadow: 
    0 0 10px #00D9FF,
    0 0 20px #00D9FF,
    0 0 30px #00D9FF,
    0 0 40px #00D9FF;
}

.neon-border {
  border: 2px solid #00D9FF;
  box-shadow: 
    inset 0 0 10px rgba(0, 217, 255, 0.5),
    0 0 20px rgba(0, 217, 255, 0.3);
}
```

#### Grid Pattern Overlay
```css
.tron-grid {
  background-image: 
    linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-move 20s linear infinite;
}
```

### Component Patterns

#### Hero Section
- Full viewport height
- Animated grid background
- Glassmorphic content container
- Neon accent lines
- Parallax depth effect

#### Navigation
- Transparent background with blur
- Neon hover effects on links
- Circuit line decorations
- Sticky positioning

#### Cards (Bento Box Layout)
- Glassmorphic backgrounds
- Neon borders on hover
- Circuit pattern overlays
- Modular sizing system
- Interactive glow animations

#### Buttons
```css
.btn-primary {
  background: linear-gradient(135deg, #00D9FF 0%, #0096DB 100%);
  border: 1px solid #00D9FF;
  box-shadow: 
    0 2px 10px rgba(0, 217, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 20px rgba(0, 217, 255, 0.5),
    0 0 30px rgba(0, 217, 255, 0.3);
}
```

### Animation System

#### Entrance Animations
- **Circuit Draw**: Lines drawing in from edges
- **Glitch In**: Digital glitch effect on text
- **Fade Glow**: Fade in with growing glow
- **Grid Reveal**: Grid pattern revealing content

#### Micro-interactions
- Hover glow intensification
- Circuit pulse on click
- Text glitch on hover
- Border trace animations

### Spacing System
- **Base unit**: 8px
- **Spacing scale**: 0, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32
- **Container max-width**: 1440px
- **Grid columns**: 12
- **Gutter**: 32px

### Responsive Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Wide**: 1440px+

### Special Effects

#### Circuit Lines
- Animated paths that trace around components
- Pulse effects along the lines
- Branch out from interactive elements

#### Digital Rain
- Matrix-style falling characters in background
- Low opacity for subtle effect
- Variable speeds and characters

#### Holographic Shimmer
- Iridescent color shift on special elements
- Subtle animation for premium feel
- Used sparingly for emphasis