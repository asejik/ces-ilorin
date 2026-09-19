import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Administration',
  description: 'Academic and administrative management portal for Citizens Elementary School faculty.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
