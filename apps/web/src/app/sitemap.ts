import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'http://localhost:3001'

  const listings = await prisma.listing.findMany({
    where: { status: 'active' },
    select: { id: true, updatedAt: true },
  })

  const staticPages = [
    '', '/explore', '/pricing', '/how-it-works', '/about',
    '/terms', '/privacy', '/cookies', '/kvkk'
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  const listingPages = listings.map(l => ({
    url: `${baseUrl}/listing/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...listingPages]
}
