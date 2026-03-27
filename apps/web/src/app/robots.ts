import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/dashboard', '/messages', '/orders', '/offers'] }
    ],
    sitemap: 'http://localhost:3001/sitemap.xml',
  }
}
