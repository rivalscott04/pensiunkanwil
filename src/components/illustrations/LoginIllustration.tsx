interface LoginIllustrationProps {
  className?: string;
}

export function LoginIllustration({ className = "" }: LoginIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={`w-full h-auto ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background elements */}
      <circle cx="350" cy="50" r="25" fill="currentColor" className="text-orange/10" />
      <circle cx="50" cy="250" r="35" fill="currentColor" className="text-orange/5" />
      
      {/* Desk surface */}
      <ellipse cx="200" cy="250" rx="150" ry="30" fill="currentColor" className="text-muted/20" />
      
      {/* Laptop base */}
      <rect x="150" y="200" width="100" height="60" rx="5" fill="currentColor" className="text-slate-600 dark:text-slate-400" />
      
      {/* Laptop screen */}
      <rect x="145" y="140" width="110" height="65" rx="3" fill="currentColor" className="text-slate-700 dark:text-slate-300" />
      <rect x="150" y="145" width="100" height="55" rx="2" fill="currentColor" className="text-orange/20" />
      
      {/* Screen content - login form mockup */}
      <rect x="160" y="155" width="80" height="6" rx="2" fill="currentColor" className="text-orange" />
      <rect x="160" y="170" width="60" height="3" rx="1" fill="currentColor" className="text-muted-foreground/40" />
      <rect x="160" y="180" width="60" height="3" rx="1" fill="currentColor" className="text-muted-foreground/40" />
      <rect x="180" y="190" width="20" height="4" rx="2" fill="currentColor" className="text-orange" />
      
      {/* Person sitting */}
      {/* Head */}
      <circle cx="200" cy="120" r="20" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      
      {/* Hair */}
      <path d="M180 105 Q200 95 220 105 Q220 115 215 120 Q200 115 185 120 Q180 115 180 105" 
            fill="currentColor" className="text-amber-800 dark:text-amber-700" />
      
      {/* Body - shirt */}
      <rect x="185" y="135" width="30" height="45" rx="6" fill="currentColor" className="text-green-600 dark:text-orange-400" />
      
      {/* Arms */}
      <rect x="170" y="145" width="15" height="25" rx="7" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      <rect x="215" y="145" width="15" height="25" rx="7" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      
      {/* Hands on laptop */}
      <circle cx="175" cy="175" r="6" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      <circle cx="225" cy="175" r="6" fill="currentColor" className="text-amber-200 dark:text-amber-300" />
      
      {/* Chair back */}
      <rect x="180" y="100" width="40" height="60" rx="20" fill="currentColor" className="text-slate-500 dark:text-slate-400" />
      
      {/* Security/Lock icons floating */}
      <g transform="translate(300, 100)">
        <circle cx="0" cy="0" r="12" fill="currentColor" className="text-success/20" />
        <rect x="-4" y="-2" width="8" height="6" rx="1" fill="currentColor" className="text-success" />
        <path d="M-2 -5 Q0 -7 2 -5" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-success" />
      </g>
      
      <g transform="translate(320, 150)">
        <circle cx="0" cy="0" r="10" fill="currentColor" className="text-orange/20" />
        <circle cx="0" cy="0" r="3" fill="currentColor" className="text-orange" />
        <path d="M-2 -1 L0 1 L4 -3" stroke="white" strokeWidth="1" fill="none" />
      </g>
      
      {/* Coffee cup */}
      <g transform="translate(280, 210)">
        <rect x="0" y="0" width="12" height="15" rx="2" fill="currentColor" className="text-amber-600 dark:text-amber-500" />
        <rect x="2" y="2" width="8" height="10" fill="currentColor" className="text-amber-800 dark:text-amber-700" />
        <path d="M12 4 Q16 4 16 8 Q16 12 12 12" stroke="currentColor" strokeWidth="1" fill="none" className="text-amber-600 dark:text-amber-500" />
        <ellipse cx="6" cy="18" rx="8" ry="2" fill="currentColor" className="text-muted/20" />
      </g>
      
      {/* Digital elements */}
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="25" height="30" rx="3" fill="currentColor" className="text-background border border-orange/30" />
        <rect x="3" y="5" width="19" height="2" rx="1" fill="currentColor" className="text-orange" />
        <rect x="3" y="10" width="15" height="1.5" rx="0.5" fill="currentColor" className="text-muted-foreground/50" />
        <rect x="3" y="15" width="12" height="1.5" rx="0.5" fill="currentColor" className="text-muted-foreground/50" />
        <circle cx="18" cy="23" r="3" fill="currentColor" className="text-success" />
        <path d="M16.5 23 L17.5 24 L19.5 22" stroke="white" strokeWidth="0.8" fill="none" />
      </g>
      
      {/* Wifi/Connection indicator */}
      <g transform="translate(100, 40)">
        <path d="M0 20 Q10 10 20 20" stroke="currentColor" strokeWidth="2" fill="none" className="text-orange/30" />
        <path d="M5 20 Q10 15 15 20" stroke="currentColor" strokeWidth="2" fill="none" className="text-orange/60" />
        <circle cx="10" cy="20" r="2" fill="currentColor" className="text-orange" />
      </g>
    </svg>
  );
}