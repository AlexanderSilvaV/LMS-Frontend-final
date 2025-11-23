"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PostComponent } from '@/components/foros/post-component'
import { XSSResultDisplay } from '@/components/debug/xss-result-display'
import { PostDTO } from '@/app/lib/types/foro-types'

export default function TestXSS() {
  const [content, setContent] = useState('<script>alert("XSS Test!")</script>')
  const [result, setResult] = useState<any>(null)
  const [testPost, setTestPost] = useState<PostDTO | null>(null)
  const [loading, setLoading] = useState(false)

  const testXSS = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/debug/test-xss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      setResult(data)

      if (data.success && data.post) {
        setTestPost(data.post)
      }
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
          <CardTitle>Prueba de XSS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Contenido del Post (con posible XSS)
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ingresa contenido potencialmente malicioso"
              rows={4}
            />
          </div>

          <Button onClick={testXSS} disabled={loading}>
            {loading ? "Probando..." : "Probar XSS"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {result?.success && result.post && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Resultado - Post Renderizado:</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <PostComponent
                  post={result.post}
                  canEdit={false}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Si ves una alerta de JavaScript, el XSS funcionó. Si no, está sanitizado.
              </p>
            </div>
          )}

          <XSSResultDisplay post={testPost} />
        </CardContent>
      </Card>
    </div>
  )
}