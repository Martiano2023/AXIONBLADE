// ---------------------------------------------------------------------------
// AI Agent Illustrations — Custom SVG illustrations for each agent
// ---------------------------------------------------------------------------
'use client';

interface IllustrationProps {
  className?: string;
}

export function KRONOSIllustration({ className = "w-full h-full" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* KRONOS - Economic Operator (Clock + Gears) — amber/orange */}
      <defs>
        <linearGradient id="kronos-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="100" cy="100" r="80" stroke="url(#kronos-gradient)" strokeWidth="3" fill="none" opacity="0.3">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite"/>
      </circle>

      {/* Inner gears */}
      <g transform="translate(100, 100)">
        <circle r="50" fill="#0F1420" stroke="url(#kronos-gradient)" strokeWidth="2"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <rect key={i} x="-3" y="-55" width="6" height="15" fill="#F59E0B" transform={`rotate(${angle})`}/>
        ))}

        {/* Clock hands */}
        <line x1="0" y1="0" x2="0" y2="-30" stroke="#F97316" strokeWidth="3" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
        </line>
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="60s" repeatCount="indefinite"/>
        </line>

        {/* Center dot */}
        <circle r="5" fill="#F59E0B"/>
      </g>

      {/* Floating coins/tokens — amber/orange only */}
      <g opacity="0.6">
        <circle cx="40" cy="60" r="8" fill="#F59E0B">
          <animate attributeName="cy" values="60;50;60" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="160" cy="80" r="6" fill="#F97316">
          <animate attributeName="cy" values="80;70;80" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="140" cy="140" r="7" fill="#F59E0B">
          <animate attributeName="cy" values="140;130;140" dur="3.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  );
}

export function AEONIllustration({ className = "w-full h-full" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* AEON - Sovereign Governor (Shield + Crown) — rose/red */}
      <defs>
        <linearGradient id="aeon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>
      </defs>

      {/* Shield base */}
      <path d="M100 30 L160 60 L160 120 Q160 150 100 170 Q40 150 40 120 L40 60 Z"
            fill="#0F1420" stroke="url(#aeon-gradient)" strokeWidth="3"/>

      {/* Shield pattern */}
      <path d="M100 50 L140 70 L140 110 Q140 130 100 145 Q60 130 60 110 L60 70 Z"
            fill="url(#aeon-gradient)" opacity="0.2"/>

      {/* Crown on top */}
      <g transform="translate(100, 30)">
        <path d="M-20 0 L-15 -15 L-10 -5 L0 -20 L10 -5 L15 -15 L20 0 Z"
              fill="#F43F5E" stroke="#F43F5E" strokeWidth="1"/>
        <circle cx="0" cy="-20" r="3" fill="#FB7185"/>
      </g>

      {/* Scan lines */}
      <g opacity="0.4">
        <line x1="60" y1="80" x2="140" y2="80" stroke="#F43F5E" strokeWidth="1">
          <animate attributeName="y1" values="80;120;80" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="80;120;80" dur="3s" repeatCount="indefinite"/>
        </line>
      </g>

      {/* Alert indicators */}
      <circle cx="100" cy="100" r="25" stroke="#F43F5E" strokeWidth="2" fill="none">
        <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

export function APOLLOIllustration({ className = "w-full h-full" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* APOLLO - DeFi Risk Evaluator (Brain + Data) — cyan/blue */}
      <defs>
        <linearGradient id="apollo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Brain outline */}
      <path d="M70 60 Q60 50 70 40 Q80 30 90 40 Q95 30 105 30 Q115 30 120 40 Q130 30 140 40 Q150 50 140 60
               L140 120 Q140 140 120 150 Q110 155 100 155 Q90 155 80 150 Q60 140 60 120 Z"
            fill="#0F1420" stroke="url(#apollo-gradient)" strokeWidth="3"/>

      {/* Neural pathways */}
      <g opacity="0.6">
        {/* Left hemisphere */}
        <circle cx="80" cy="70" r="3" fill="#00D4FF"/>
        <circle cx="75" cy="90" r="3" fill="#00D4FF"/>
        <circle cx="80" cy="110" r="3" fill="#00D4FF"/>
        <line x1="80" y1="70" x2="75" y2="90" stroke="#00D4FF" strokeWidth="1"/>
        <line x1="75" y1="90" x2="80" y2="110" stroke="#00D4FF" strokeWidth="1"/>

        {/* Right hemisphere */}
        <circle cx="120" cy="70" r="3" fill="#0EA5E9"/>
        <circle cx="125" cy="90" r="3" fill="#0EA5E9"/>
        <circle cx="120" cy="110" r="3" fill="#0EA5E9"/>
        <line x1="120" y1="70" x2="125" y2="90" stroke="#0EA5E9" strokeWidth="1"/>
        <line x1="125" y1="90" x2="120" y2="110" stroke="#0EA5E9" strokeWidth="1"/>

        {/* Connections */}
        <line x1="80" y1="90" x2="120" y2="90" stroke="url(#apollo-gradient)" strokeWidth="1" strokeDasharray="3,3">
          <animate attributeName="stroke-dashoffset" from="0" to="6" dur="1s" repeatCount="indefinite"/>
        </line>
      </g>

      {/* Thinking particles */}
      <g opacity="0.5">
        <circle cx="100" cy="50" r="2" fill="#00D4FF">
          <animate attributeName="cy" values="50;30;50" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="110" cy="55" r="2" fill="#0EA5E9">
          <animate attributeName="cy" values="55;35;55" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0;1" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  );
}

export function HERMESIllustration({ className = "w-full h-full" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* HERMES - DeFi Intelligence (Lightning + Speed) — purple */}
      <defs>
        <linearGradient id="hermes-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      {/* Lightning bolt */}
      <path d="M110 30 L70 100 L95 100 L85 170 L140 85 L115 85 Z"
            fill="url(#hermes-gradient)" opacity="0.8">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite"/>
      </path>

      {/* Energy rings */}
      <circle cx="100" cy="100" r="60" stroke="#A855F7" strokeWidth="2" fill="none" opacity="0.3">
        <animate attributeName="r" values="60;70;60" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="100" cy="100" r="60" stroke="#C084FC" strokeWidth="2" fill="none" opacity="0.3">
        <animate attributeName="r" values="60;70;60" dur="2s" begin="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" begin="1s" repeatCount="indefinite"/>
      </circle>

      {/* Speed lines */}
      <g opacity="0.6">
        <line x1="30" y1="95" x2="70" y2="95" stroke="#A855F7" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="x1" values="30;50;30" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="x2" values="70;90;70" dur="1.5s" repeatCount="indefinite"/>
        </line>
        <line x1="130" y1="105" x2="170" y2="105" stroke="#C084FC" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="x1" values="130;110;130" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="x2" values="170;150;170" dur="1.5s" repeatCount="indefinite"/>
        </line>
      </g>
    </svg>
  );
}
