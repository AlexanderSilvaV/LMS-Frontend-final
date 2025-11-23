"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  type: "atom" | "molecule" | "bond"
  color: string
  rotation: number
  rotationSpeed: number
}

export function ChemistryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      const particles: Particle[] = []
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000)

      for (let i = 0; i < particleCount; i++) {
        const types: Array<"atom" | "molecule" | "bond"> = ["atom", "molecule", "bond"]
        const colors = [
          "rgba(59, 130, 246, 0.1)", // blue
          "rgba(16, 185, 129, 0.1)", // green
          "rgba(245, 158, 11, 0.1)", // amber
          "rgba(239, 68, 68, 0.1)", // red
          "rgba(139, 92, 246, 0.1)", // purple
          "rgba(6, 182, 212, 0.1)", // cyan
        ]

        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 8 + 4,
          type: types[Math.floor(Math.random() * types.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
        })
      }

      particlesRef.current = particles
    }

    const drawAtom = (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)

      // Nucleus
      ctx.fillStyle = particle.color.replace("0.1", "0.3")
      ctx.beginPath()
      ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2)
      ctx.fill()

      // Electron orbits
      ctx.strokeStyle = particle.color
      ctx.lineWidth = 1

      for (let i = 0; i < 3; i++) {
        const radius = particle.size * (0.6 + i * 0.3)
        ctx.beginPath()
        ctx.ellipse(0, 0, radius, radius * 0.6, (i * Math.PI) / 3, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()
    }

    const drawMolecule = (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)

      // Draw connected atoms
      const atomPositions = [
        { x: -particle.size * 0.4, y: 0 },
        { x: particle.size * 0.4, y: 0 },
        { x: 0, y: -particle.size * 0.3 },
      ]

      // Draw bonds
      ctx.strokeStyle = particle.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(atomPositions[0].x, atomPositions[0].y)
      ctx.lineTo(atomPositions[1].x, atomPositions[1].y)
      ctx.moveTo(atomPositions[0].x, atomPositions[0].y)
      ctx.lineTo(atomPositions[2].x, atomPositions[2].y)
      ctx.moveTo(atomPositions[1].x, atomPositions[1].y)
      ctx.lineTo(atomPositions[2].x, atomPositions[2].y)
      ctx.stroke()

      // Draw atoms
      ctx.fillStyle = particle.color.replace("0.1", "0.2")
      atomPositions.forEach((pos) => {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, particle.size * 0.15, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.restore()
    }

    const drawBond = (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)

      ctx.strokeStyle = particle.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-particle.size * 0.5, 0)
      ctx.lineTo(particle.size * 0.5, 0)
      ctx.stroke()

      // End atoms
      ctx.fillStyle = particle.color.replace("0.1", "0.2")
      ctx.beginPath()
      ctx.arc(-particle.size * 0.5, 0, particle.size * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(particle.size * 0.5, 0, particle.size * 0.1, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed

        // Wrap around edges
        if (particle.x < -particle.size) particle.x = canvas.width + particle.size
        if (particle.x > canvas.width + particle.size) particle.x = -particle.size
        if (particle.y < -particle.size) particle.y = canvas.height + particle.size
        if (particle.y > canvas.height + particle.size) particle.y = -particle.size

        // Draw particle based on type
        switch (particle.type) {
          case "atom":
            drawAtom(ctx, particle)
            break
          case "molecule":
            drawMolecule(ctx, particle)
            break
          case "bond":
            drawBond(ctx, particle)
            break
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    animate()

    const handleResize = () => {
      resizeCanvas()
      createParticles()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ background: "transparent" }} />
  )
}
