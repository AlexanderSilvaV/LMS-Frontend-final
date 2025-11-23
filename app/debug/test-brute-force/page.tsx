"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestBruteForce() {
  const [username, setUsername] = useState('test@example.com')
  const [passwords, setPasswords] = useState('password\n123456\nadmin\nqwerty\nletmein\nwelcome\nmonkey\npassword1\ndragon\nbaseball')
  const [count, setCount] = useState(10)
  const [delay, setDelay] = useState(1000)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBruteForce = async () => {
    setLoading(true)
    try {
      const passwordArray = passwords.split('\n').filter(p => p.trim())
      const response = await fetch("/api/debug/test-brute-force", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          passwords: passwordArray,
          count,
          delay
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Brute Force Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Username/Email</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="passwords">Lista de Contraseñas (una por línea)</Label>
            <Textarea
              id="passwords"
              value={passwords}
              onChange={(e) => setPasswords(e.target.value)}
              placeholder="password&#10;123456&#10;admin&#10;qwerty"
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="count">Número máximo de intentos</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="delay">Delay entre intentos (ms)</Label>
              <Input
                id="delay"
                type="number"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
                min="0"
                max="10000"
              />
            </div>
          </div>

          <Button onClick={testBruteForce} disabled={loading}>
            {loading ? "Probando..." : "Probar Brute Force"}
          </Button>

          {result && (
            <Alert variant={result.bruteForceResult?.bruteForceSuccessful ? "destructive" : "default"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{result.message}</p>
                  {result.bruteForceResult && (
                    <div className="text-sm">
                      <p>Total de intentos: {result.bruteForceResult.totalAttempts}</p>
                      <p>Éxitos: {result.bruteForceResult.successCount}</p>
                      <p>Bloqueados por rate limit: {result.bruteForceResult.blockedCount}</p>
                      {result.bruteForceResult.bruteForceSuccessful && (
                        <p className="text-red-600 font-medium">
                          ⚠️ VULNERABILIDAD: ¡Brute force exitoso!
                        </p>
                      )}
                      {result.bruteForceResult.rateLimited && (
                        <p className="text-green-600 font-medium">
                          ✅ PROTEGIDO: Rate limiting activo
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}