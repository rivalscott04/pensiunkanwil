interface HeroIllustrationProps {
  className?: string;
}

export function HeroIllustration({ className = "" }: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 500 400"
      className={`w-full h-auto ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circles */}
      <circle cx="450" cy="50" r="30" fill="currentColor" className="text-orange/10" />
      <circle cx="50" cy="350" r="40" fill="currentColor" className="text-orange/5" />
      
      {/* Desk */}
      <rect x="120" y="280" width="260" height="80" rx="8" fill="currentColor" className="text-muted/30" />
      
      {/* Laptop */}
      <rect x="180" y="240" width="140" height="90" rx="4" fill="currentColor" className="text-slate-700 dark:text-slate-300" />
      <rect x="185" y="245" width="130" height="75" rx="2" fill="currentColor" className="text-orange/20" />
      
      {/* Laptop screen content */}
      <rect x="190" y="250" width="120" height="8" rx="2" fill="currentColor" className="text-orange" />
      <rect x="190" y="265" width="80" height="4" rx="1" fill="currentColor" className="text-muted-foreground/50" />
      <rect x="190" y="275" width="100" height="4" rx="1" fill="currentColor" className="text-muted-foreground/50" />
      <rect x="190" y="285" width="60" height="4" rx="1" fill="currentColor" className="text-muted-foreground/50" />
      
      {/* Check marks on screen */}
      <circle cx="280" cy="267" r="6" fill="currentColor" className="text-success" />
      <path d="M277 267 L279 269 L283 265" stroke="white" strokeWidth="1.5" fill="none" />
      
      <circle cx="280" cy="287" r="6" fill="currentColor" className="text-success" />
      <path d="M277 287 L279 289 L283 285" stroke="white" strokeWidth="1.5" fill="none" />
      
      {/* Person */}
      {/* Head */}
      <circle cx="250" cy="180" r="25" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      
      {/* Hair */}
      <path d="M225 165 Q250 150 275 165 Q275 175 270 180 Q250 175 230 180 Q225 175 225 165" 
            fill="currentColor" className="text-amber-800 dark:text-amber-700" />
      
      {/* Body */}
      <rect x="230" y="200" width="40" height="60" rx="8" fill="currentColor" className="text-green-600 dark:text-orange-400" />
      
      {/* Arms */}
      <rect x="210" y="210" width="20" height="35" rx="10" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      <rect x="270" y="210" width="20" height="35" rx="10" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      
      {/* Hand pointing to laptop */}
      <circle cx="290" cy="250" r="8" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      
      {/* Documents floating */}
      <rect x="350" y="150" width="40" height="50" rx="4" fill="currentColor" className="text-background border border-orange/30" transform="rotate(15 370 175)" />
      <rect x="355" y="155" width="30" height="3" rx="1" fill="currentColor" className="text-orange" transform="rotate(15 370 157)" />
      <rect x="355" y="165" width="25" height="2" rx="1" fill="currentColor" className="text-muted-foreground/50" transform="rotate(15 370 166)" />
      <rect x="355" y="175" width="30" height="2" rx="1" fill="currentColor" className="text-muted-foreground/50" transform="rotate(15 370 176)" />
      
      <rect x="80" y="120" width="40" height="50" rx="4" fill="currentColor" className="text-background border border-orange/30" transform="rotate(-10 100 145)" />
      <rect x="85" y="125" width="30" height="3" rx="1" fill="currentColor" className="text-orange" transform="rotate(-10 100 127)" />
      <rect x="85" y="135" width="25" height="2" rx="1" fill="currentColor" className="text-muted-foreground/50" transform="rotate(-10 100 136)" />
      <rect x="85" y="145" width="30" height="2" rx="1" fill="currentColor" className="text-muted-foreground/50" transform="rotate(-10 100 146)" />
      
      {/* Clock on wall */}
      <circle cx="100" cy="80" r="20" fill="currentColor" className="text-background border-2 border-orange/30" />
      <circle cx="100" cy="80" r="2" fill="currentColor" className="text-orange" />
      <path d="M100 80 L100 70" stroke="currentColor" strokeWidth="2" className="text-orange" />
      <path d="M100 80 L110 80" stroke="currentColor" strokeWidth="1.5" className="text-orange" />
      
      {/* Progress indicators */}
      <g transform="translate(400, 250)">
        <circle cx="0" cy="0" r="8" fill="currentColor" className="text-success" />
        <circle cx="0" cy="20" r="8" fill="currentColor" className="text-success" />
        <circle cx="0" cy="40" r="8" fill="currentColor" className="text-orange/30" />
        <path d="-3 -2 L-1 0 L3 -4" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="-3 18 L-1 20 L3 16" stroke="white" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}