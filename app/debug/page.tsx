"use client"

import { useEffect, useState } from "react"

export default function DebugPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found in localStorage")
        return
      }

      // Decode JWT payload
      const parts = token.split('.')
      if (parts.length !== 3) {
        setError("Invalid token format")
        return
      }

      const payload = JSON.parse(atob(parts[1]))
      const header = JSON.parse(atob(parts[0]))
      
      const now = Math.floor(Date.now() / 1000)
      const isExpired = payload.exp && payload.exp < now

      setTokenInfo({
        header,
        payload,
        isExpired,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : null,
        tokenLength: token.length
      })
    } catch (err) {
      setError(`Error decoding token: ${err}`)
    }
  }, [])

  const testBackendConnection = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/profile/info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ Nombre: "Test", Correo: "test@test.com" })
      })
      
      const text = await response.text()
      console.log("Backend response:", { status: response.status, text })
      alert(`Backend response: ${response.status} - ${text}`)
    } catch (err) {
      console.error("Error testing backend:", err)
      alert(`Error: ${err}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Token Debug Information</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {tokenInfo && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Token Status</h2>
            <p>Expired: {tokenInfo.isExpired ? "YES" : "NO"}</p>
            <p>Token Length: {tokenInfo.tokenLength}</p>
            <p>Expires At: {tokenInfo.expiresAt}</p>
            <p>Issued At: {tokenInfo.issuedAt}</p>
          </div>
          
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Token Claims</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(tokenInfo.payload, null, 2)}
            </pre>
          </div>
          
          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Token Header</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(tokenInfo.header, null, 2)}
            </pre>
          </div>
          
          <button 
            onClick={testBackendConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Backend Connection
          </button>
        </div>
      )}
    </div>
  )
}
