import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ces.citizensoflightchurch.org';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/register/success',
          '/certificate/',
          '/assessment',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
