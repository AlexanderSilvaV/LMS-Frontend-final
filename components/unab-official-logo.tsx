import React from 'react'

interface UNABOfficialLogoProps {
  className?: string
  width?: number
  height?: number
}

export function UNABOfficialLogo({ className = "", width = 120, height = 120 }: UNABOfficialLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo SVG */}
      <svg
        width={width}
        height={height * 0.7} // Ajustar proporción para el símbolo
        viewBox="0 0 200 140"
        className="mb-2"
      >
        {/* Círculo exterior navy */}
        <circle
          cx="100"
          cy="70"
          r="65"
          fill="#2C3E50"
          stroke="#ffffff"
          strokeWidth="3"
        />
        
        {/* Círculo interior blanco */}
        <circle
          cx="100"
          cy="70"
          r="45"
          fill="#ffffff"
        />
        
        {/* Edificios rojos en el centro */}
        <g transform="translate(100, 70)">
          {/* Edificio izquierdo */}
          <rect
            x="-25"
            y="-15"
            width="15"
            height="30"
            fill="#C53030"
          />
          
          {/* Edificio central (más alto con punta) */}
          <rect
            x="-7.5"
            y="-20"
            width="15"
            height="40"
            fill="#C53030"
          />
          <polygon
            points="-7.5,-20 0,-30 7.5,-20"
            fill="#C53030"
          />
          
          {/* Edificio derecho */}
          <rect
            x="10"
            y="-15"
            width="15"
            height="30"
            fill="#C53030"
          />
        </g>
        
        {/* Base decorativa */}
        <path
          d="M 40 130 Q 100 115 160 130"
          fill="none"
          stroke="#2C3E50"
          strokeWidth="4"
        />
        <path
          d="M 45 135 Q 100 120 155 135"
          fill="none"
          stroke="#2C3E50"
          strokeWidth="2"
        />
      </svg>
      
      {/* Texto Universidad */}
      <div className="text-center">
        <div className="text-lg font-bold text-unab-navy dark:text-white tracking-wide">
          Universidad
        </div>
        <div className="text-xl font-bold text-unab-navy dark:text-white tracking-wide">
          Andrés Bello
        </div>
        <div className="text-xs text-unab-gray-600 dark:text-unab-gray-400 mt-1">
          ®
        </div>
      </div>
    </div>
  )
}

// Versión compacta solo con el símbolo para usar en navbar/sidebar
export function UNABLogoCompact({ className = "", size = 40 }: { className?: string, size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
    >
      {/* Círculo exterior navy */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#2C3E50"
        stroke="#ffffff"
        strokeWidth="2"
      />
      
      {/* Círculo interior blanco */}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="#ffffff"
      />
      
      {/* Edificios rojos en el centro */}
      <g transform="translate(50, 50)">
        {/* Edificio izquierdo */}
        <rect
          x="-18"
          y="-10"
          width="11"
          height="20"
          fill="#C53030"
        />
        
        {/* Edificio central (más alto con punta) */}
        <rect
          x="-5.5"
          y="-14"
          width="11"
          height="28"
          fill="#C53030"
        />
        <polygon
          points="-5.5,-14 0,-20 5.5,-14"
          fill="#C53030"
        />
        
        {/* Edificio derecho */}
        <rect
          x="7"
          y="-10"
          width="11"
          height="20"
          fill="#C53030"
        />
      </g>
    </svg>
  )
}
