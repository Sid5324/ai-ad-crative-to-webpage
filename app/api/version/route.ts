import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: "1.1.0",
    features: [
      "Cyberpunk UI with neon effects",
      "AI ad content input",
      "Real-time webpage generation",
      "Live preview iframe",
      "HTML export functionality",
      "Fixed ESLint dependencies",
      "Improved font loading"
    ],
    lastUpdated: new Date().toISOString()
  })
}