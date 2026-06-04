import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ExampleHR – Time-Off',
  description: 'Time-off management for ExampleHR',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b px-6 py-4 mb-6">
              <div className="max-w-6xl mx-auto flex items-center gap-6">
                <span className="font-bold text-gray-900">ExampleHR</span>
                <a href="/employee" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Employee
                </a>
                <a href="/manager" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Manager
                </a>
              </div>
            </nav>
            <div className="max-w-6xl mx-auto px-6 pb-12">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  )
}
