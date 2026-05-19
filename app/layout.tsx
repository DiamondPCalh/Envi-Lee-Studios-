import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Envi Lee AI Creator Suite™',
  description: 'AI-powered POD mockups, product listings, scripts, cinematic prompts, and brand deals.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      </head>
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#f4f4ff' }}>{children}</body>
    </html>
  )
}
