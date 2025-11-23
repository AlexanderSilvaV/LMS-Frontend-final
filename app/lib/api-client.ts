const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7041' // Usar el backend ASP.NET Core

interface ApiResponse<T> {
  operacionExitosa?: boolean
  exito?: boolean
  dato?: T
  mensaje?: string
  codigo?: number
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const responseText = await response.text()
    
    console.log('API Client Response:', {
      status: response.status,
      statusText: response.statusText,
      responseText: responseText.substring(0, 500), // Limitar para evitar logs gigantes
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        if (responseText) {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.mensaje || errorData.message || errorData.error || errorMessage
        }
      } catch {
        errorMessage = responseText || errorMessage
      }

      console.error('API Client Error:', errorMessage)
      throw new Error(errorMessage)
    }

    if (!responseText || responseText.trim() === "") {
      return {} as T
    }

    try {
      const parsedResponse = JSON.parse(responseText)
      console.log('API Client Parsed Response:', parsedResponse)
      return parsedResponse
    } catch (parseError) {
      console.error('API Client Parse Error:', parseError, 'Raw response:', responseText)
      return responseText as unknown as T
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
