import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Class Attendance & Delivery Rating',
  description:
    'Confirm attendance for Saturday and Sunday cohorts and submit real-time teacher and session delivery ratings at Citizens Elementary School.',
  alternates: {
    canonical: '/attendance',
  },
  openGraph: {
    title: 'Class Attendance & Delivery Rating | Citizens Elementary School',
    description:
      'Confirm cohort class attendance and rate lecture delivery at Citizens Elementary School, Ilorin.',
    url: '/attendance',
  },
};

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
