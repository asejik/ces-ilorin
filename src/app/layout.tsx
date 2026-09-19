import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const siteUrl = 'https://ces.citizensoflightchurch.org';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Citizens Elementary School | Discipleship Training Platform',
    template: '%s | Citizens Elementary School',
  },
  description:
    'Official Academic Management and Discipleship Training Portal for Citizens of Light Church, Ilorin. Enroll in cohorts, take continuous assessments, and achieve ministerial certification.',
  keywords: [
    'Citizens Elementary School',
    'CES Ilorin',
    'Citizens of Light Church',
    'Discipleship Training Programme',
    'Christian Education Nigeria',
    'Biblical School Ilorin',
  ],
  authors: [{ name: 'Citizens of Light Church' }],
  creator: 'Citizens of Light Church, Ilorin',
  alternates: {
    canonical: './',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'Citizens Elementary School',
    title: 'Citizens Elementary School | Discipleship Training Platform',
    description:
      'Equipping Believers with Kingdom Truth & Integrity. Official academic portal for Citizens of Light Church, Ilorin.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Citizens Elementary School Discipleship Training Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Citizens Elementary School | Discipleship Training Platform',
    description:
      'Equipping Believers with Kingdom Truth & Integrity. Official academic portal for Citizens of Light Church, Ilorin.',
    images: ['/og-image.png'],
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${siteUrl}/#organization`,
      name: 'Citizens Elementary School',
      alternateName: 'CES Ilorin',
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      image: `${siteUrl}/og-image.png`,
      parentOrganization: {
        '@type': 'Church',
        name: 'Citizens of Light Church',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Ilorin',
        addressRegion: 'Kwara State',
        addressCountry: 'NG',
      },
    },
    {
      '@type': 'Course',
      '@id': `${siteUrl}/#course`,
      name: 'Citizens Elementary School Discipleship Programme',
      description:
        'Foundational Christian discipleship course curriculum covering Salvation, Righteousness, Word of God, Love Walk, Service, Spiritual Authority, Holy Spirit, and Prayer.',
      provider: {
        '@id': `${siteUrl}/#organization`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-screen bg-canvas text-ink-950 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
