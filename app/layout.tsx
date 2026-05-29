import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Envi Lee Global Empire',
  description: 'The AI Creator Ecosystem — POD Studios, AI Studios, Music Studios, Academy Studios, Creator Suite',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        </head>
        <body style={{ margin: 0, padding: 0, background: '#000', color: '#f4f4ff' }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
