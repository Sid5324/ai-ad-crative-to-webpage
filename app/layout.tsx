import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Ad Creative to Webpage',
  description: 'Convert AI-generated ad creatives into web pages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-cyan-400 font-mono">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}