import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Assessment Portal',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/assess',
  },
};

export default function AssessmentAliasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
