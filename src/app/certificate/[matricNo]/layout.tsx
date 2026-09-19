import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Graduation Certificate Verification',
  description:
    'Official digital graduation certificate verification for Citizens Elementary School graduates, Citizens of Light Church, Ilorin.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
