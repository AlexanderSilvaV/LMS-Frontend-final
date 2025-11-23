"use client"

import { useState } from "react"

export default function BackendTest() {
  const [moduleId, setModuleId] = useState("1")
  const [materials, setMaterials] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const testMaterials = async () => {
    try {
      const response = await fetch(`/api/materials/modulo/${moduleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || "Failed to fetch materials")
        setMaterials([])
        return
      }

      const data = await response.json()
      setMaterials(data)
      setError(null)
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred")
      setMaterials([])
    }
  }

  return (
    <div>
      <h1>Backend Test Page</h1>
      <div>
        <label htmlFor="moduleId">Module ID:</label>
        <input type="text" id="moduleId" value={moduleId} onChange={(e) => setModuleId(e.target.value)} />
        <button onClick={testMaterials}>Test Materials Endpoint</button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <h2>Materials:</h2>
      <ul>
        {materials.map((material: any) => (
          <li key={material.id}>
            {material.title} - {material.url}
          </li>
        ))}
      </ul>
    </div>
  )
}
