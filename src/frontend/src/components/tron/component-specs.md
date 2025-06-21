# Tron Design System Component Specifications

## 1. TronButton Component

### Props
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `icon?`: React.ReactNode
- `iconPosition?`: 'left' | 'right'
- `loading?`: boolean
- `disabled?`: boolean
- `fullWidth?`: boolean
- `onClick?`: () => void
- `href?`: string

### Visual Specifications
- **Primary**: Cyan gradient background with neon glow
- **Secondary**: Transparent with neon border
- **Danger**: Orange/red gradient with warning glow
- **Ghost**: No border, subtle hover effect

### Animations
- Hover: translateY(-2px) with increased glow
- Active: scale(0.95)
- Loading: Rotating circuit animation

## 2. GlassPanel Component

### Props
- `variant?`: 'default' | 'elevated' | 'inset'
- `glow?`: 'cyan' | 'orange' | 'purple' | 'green' | 'none'
- `padding?`: 'sm' | 'md' | 'lg'
- `borderRadius?`: 'sm' | 'md' | 'lg' | 'xl'
- `interactive?`: boolean
- `className?`: string

### Visual Specifications
- Background: rgba(10, 14, 20, 0.6)
- Backdrop filter: blur(20px) saturate(180%)
- Border: 1px solid with color based on glow prop
- Inset shadow for depth

### Interactive States
- Hover (if interactive): Border pulse animation
- Active: Slight scale reduction

## 3. NeonText Component

### Props
- `variant`: 'hero' | 'title' | 'subtitle' | 'body'
- `glow?`: 'cyan' | 'orange' | 'purple' | 'multi'
- `animate?`: 'pulse' | 'glitch' | 'gradient' | 'none'
- `as?`: 'h1' | 'h2' | 'h3' | 'p' | 'span'

### Visual Specifications
- Text shadow with multiple layers for glow effect
- Gradient text option with animated background position
- Glitch effect with RGB channel separation

## 4. CircuitLine Component

### Props
- `direction`: 'horizontal' | 'vertical' | 'diagonal'
- `length`: number | string
- `animated?`: boolean
- `speed?`: 'slow' | 'normal' | 'fast'
- `color?`: 'cyan' | 'orange' | 'purple'
- `pulse?`: boolean

### Visual Specifications
- 2px solid line with box-shadow glow
- Optional pulse animation
- Movement animation along path

## 5. TronCard Component

### Props
- `title?`: string
- `icon?`: React.ReactNode
- `variant?`: 'default' | 'featured' | 'compact'
- `borderGlow?`: boolean
- `hoverEffect?`: 'glow' | 'lift' | 'border' | 'none'
- `onClick?`: () => void

### Visual Specifications
- Glass panel background
- Optional animated border on hover
- Icon container with colored background

### Layout Variants
- **Default**: Standard padding and spacing
- **Featured**: Larger padding, prominent title
- **Compact**: Minimal padding for dense layouts

## 6. ZoneIndicator Component

### Props
- `type`: 'safe' | 'danger' | 'neutral'
- `size`: number
- `position`: { x: number, y: number }
- `animated?`: boolean
- `opacity?`: number

### Visual Specifications
- **Safe**: Cyan border with pulse
- **Danger**: Orange/red border with warning pulse
- **Neutral**: White border with subtle glow

### Animations
- Pulse: Scale and opacity animation
- Rotation: Slow 360° rotation for active zones

## 7. LoadingSpinner Component

### Props
- `size?`: 'sm' | 'md' | 'lg'
- `color?`: 'cyan' | 'orange' | 'white'
- `variant?`: 'circuit' | 'dots' | 'ring'

### Visual Specifications
- **Circuit**: Double ring with opposite rotations
- **Dots**: Three dots with staggered pulse
- **Ring**: Single ring with gradient

## 8. StatDisplay Component

### Props
- `label`: string
- `value`: string | number
- `trend?`: 'up' | 'down' | 'neutral'
- `icon?`: React.ReactNode
- `size?`: 'sm' | 'md' | 'lg'
- `animate?`: boolean

### Visual Specifications
- Glass panel container
- Icon with colored background
- Value with larger font size
- Optional trend indicator with color coding

## 9. NavigationBar Component

### Props
- `items`: NavItem[]
- `variant?`: 'fixed' | 'static'
- `transparent?`: boolean
- `showLogo?`: boolean
- `actions?`: React.ReactNode

### Visual Specifications
- Blur background when scrolled
- Underline animation on hover
- Active state with persistent underline

## 10. HeroSection Component

### Props
- `title`: string
- `subtitle?`: string
- `backgroundEffect?`: 'grid' | 'circuit' | 'particles' | 'none'
- `actions?`: React.ReactNode
- `stats?`: StatItem[]

### Visual Specifications
- Full viewport height
- Parallax background effect
- Centered content with max-width
- Optional stats bar at bottom

## Animation Specifications

### Entrance Animations
```css
/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Circuit Draw */
@keyframes circuitDraw {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Glitch In */
@keyframes glitchIn {
  0% {
    opacity: 0;
    transform: translateX(-10px);
    filter: hue-rotate(90deg);
  }
  20% {
    transform: translateX(10px);
  }
  40% {
    transform: translateX(-5px);
  }
  60% {
    transform: translateX(5px);
  }
  80% {
    transform: translateX(0);
    filter: hue-rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Interaction States
- **Hover**: 300ms ease transition
- **Active**: 100ms ease-out transition
- **Focus**: Neon outline with glow

## Responsive Behavior

### Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Mobile Adaptations
- Larger touch targets (min 44px)
- Reduced animation complexity
- Stacked layouts for cards
- Simplified navigation (hamburger menu)
- Adjusted typography scale

## Accessibility

### Focus States
- High contrast neon outline
- Skip navigation links
- ARIA labels for decorative elements
- Reduced motion media query support

### Color Contrast
- All text meets WCAG AA standards
- Interactive elements have distinct states
- Error states use multiple indicators (color + icon)