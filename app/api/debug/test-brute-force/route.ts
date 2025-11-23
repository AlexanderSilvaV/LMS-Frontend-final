import { NextRequest, NextResponse } from "next/server"

const BACKEND_BASE_URL = 'http://localhost:5253'

export async function POST(request: NextRequest) {
  try {
    const { username = 'test@example.com', passwords, count = 10, delay = 500 } = await request.json()

    console.log("🔨 [TEST-BRUTE-FORCE] Testing brute force login")

    if (!passwords || !Array.isArray(passwords)) {
      return NextResponse.json({
        success: false,
        error: "Passwords array is required"
      }, { status: 400 })
    }

    const results = []
    let successCount = 0
    let blockedCount = 0

    const testPasswords = count > passwords.length ? passwords : passwords.slice(0, count)

    for (let i = 0; i < testPasswords.length; i++) {
      try {
        console.log(`🔨 [TEST-BRUTE-FORCE] Attempt ${i + 1}/${testPasswords.length} with password: ${testPasswords[i]}`)

        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: username,
            password: testPasswords[i]
          })
        })

        const responseData = await response.json()
        const status = response.status

        results.push({
          attempt: i + 1,
          password: testPasswords[i],
          status,
          success: response.ok,
          message: responseData.message || responseData.error,
          timestamp: new Date().toISOString()
        })

        if (response.ok) {
          successCount++
          console.log("🔓 [TEST-BRUTE-FORCE] SUCCESS! Password found:", testPasswords[i])
          break // Stop on success
        }

        if (status === 429) {
          blockedCount++
          console.log("🚫 [TEST-BRUTE-FORCE] Rate limited!")
        }

        // Delay between attempts
        if (delay > 0 && i < testPasswords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        console.error(`❌ [TEST-BRUTE-FORCE] Attempt ${i + 1} failed:`, error)
        results.push({
          attempt: i + 1,
          password: testPasswords[i],
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    const bruteForceSuccessful = successCount > 0
    const rateLimited = blockedCount > 0

    console.log(`🔨 [TEST-BRUTE-FORCE] Completed: ${successCount} success, ${blockedCount} blocked`)

    return NextResponse.json({
      success: true,
      message: bruteForceSuccessful
        ? "Brute force successful - password found!"
        : rateLimited
        ? "Brute force blocked by rate limiting"
        : "Brute force failed - no password found",
      bruteForceResult: {
        totalAttempts: testPasswords.length,
        successCount,
        blockedCount,
        bruteForceSuccessful,
        rateLimited,
        results
      }
    })

  } catch (error) {
    console.error("❌ [TEST-BRUTE-FORCE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}