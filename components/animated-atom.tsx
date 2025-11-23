"use client"

import { motion } from "framer-motion"

export function AnimatedAtom() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Núcleo central */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-6 h-6 bg-gradient-to-r from-unab-red to-unab-red-light rounded-full"
        style={{ marginLeft: "-12px", marginTop: "-12px" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />

      {/* Órbita 1 */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-unab-navy/30 rounded-full"
        style={{ marginLeft: "-64px", marginTop: "-64px" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <motion.div
          className="absolute w-3 h-3 bg-unab-navy rounded-full"
          style={{ top: "-6px", left: "50%", marginLeft: "-6px" }}
        />
      </motion.div>

      {/* Órbita 2 */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-44 h-44 border-2 border-unab-red/20 rounded-full"
        style={{ marginLeft: "-88px", marginTop: "-88px", transform: "rotate(45deg)" }}
        animate={{ rotate: 405 }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <motion.div
          className="absolute w-3 h-3 bg-unab-red rounded-full"
          style={{ top: "-6px", left: "50%", marginLeft: "-6px" }}
        />
      </motion.div>

      {/* Órbita 3 */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-unab-navy-light/20 rounded-full"
        style={{ marginLeft: "-96px", marginTop: "-96px", transform: "rotate(-30deg)" }}
        animate={{ rotate: 330 }}
        transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <motion.div
          className="absolute w-2 h-2 bg-unab-navy-light rounded-full"
          style={{ top: "-4px", left: "50%", marginLeft: "-4px" }}
        />
      </motion.div>

      {/* Efectos de resplandor */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-r from-unab-red/20 to-unab-navy/20 rounded-full blur-xl"
        style={{ marginLeft: "-40px", marginTop: "-40px" }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}
