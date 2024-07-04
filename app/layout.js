import 'dotenv/config'
import './globals.css'

export const metadata = {
  title: 'ERP Clearance',
  description: 'Product management and price update system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}