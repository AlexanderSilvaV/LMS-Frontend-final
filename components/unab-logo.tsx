"use client"

import React from 'react'

interface UNABLogoProps {
  className?: string
  size?: number
}

export function UNABLogo({ className = "", size = 24 }: UNABLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-full bg-unab-navy dark:bg-unab-navy-light border-2 border-white"
        style={{ width: size, height: size }}
      >
        <div className="flex items-center justify-center">
          <div className="flex space-x-0.5">
            <div 
              className="bg-unab-red dark:bg-unab-red-light"
              style={{ 
                width: Math.max(2, size * 0.15), 
                height: Math.max(4, size * 0.25) 
              }}
            />
            <div 
              className="bg-unab-red dark:bg-unab-red-light"
              style={{ 
                width: Math.max(2, size * 0.15), 
                height: Math.max(6, size * 0.35),
                marginTop: -1
              }}
            />
            <div 
              className="bg-unab-red dark:bg-unab-red-light"
              style={{ 
                width: Math.max(2, size * 0.15), 
                height: Math.max(4, size * 0.25) 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default UNABLogo
