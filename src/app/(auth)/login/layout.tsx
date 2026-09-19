import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Login',
  description: 'Administrative portal login for Citizens Elementary School staff and faculty.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
