import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cohort Registration & Enrollment',
  description:
    'Register for the upcoming Citizens Elementary School discipleship training cohort. Complete candidate enrollment, verify NDPA privacy consent, and enter the foundational spiritual formation track.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Cohort Registration & Enrollment | Citizens Elementary School',
    description:
      'Enroll in the upcoming discipleship training cohort at Citizens Elementary School, Citizens of Light Church, Ilorin.',
    url: '/register',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
