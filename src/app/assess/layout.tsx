import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Assessment Portal',
  description:
    'Take modular quizzes and continuous assessments for Citizens Elementary School. Access course tests in Salvation, Righteousness, Spiritual Authority, Holy Spirit, and more.',
  alternates: {
    canonical: '/assess',
  },
  openGraph: {
    title: 'Candidate Assessment Portal | Citizens Elementary School',
    description:
      'Continuous assessments and examinations for Citizens Elementary School discipleship candidates.',
    url: '/assess',
  },
};

export default function AssessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
