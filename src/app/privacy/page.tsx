import type { Metadata } from 'next';
import Link from 'next/link';
import { RESPONSE_DAYS, RETENTION_YEARS, privacyContactEmail } from '@/lib/privacy';

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'How Citizens Elementary School collects, uses, keeps and protects your information.',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading font-bold text-lg text-ink-950">{title}</h2>
    <div className="text-sm text-ink-700 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function PrivacyPage() {
  const email = privacyContactEmail();
  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-xs font-semibold text-ink-600 hover:text-ink-950">
            ← Citizens Elementary School
          </Link>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink-950">Privacy Notice</h1>
          <p className="text-sm text-ink-600">
            Citizens of Light Church / Citizens Elementary School, Ilorin, Nigeria. This notice follows the Nigeria Data
            Protection Act 2023 (NDPA).
          </p>
        </header>

        <Section title="What we collect">
          <p>
            When you register: your name, passport photograph, email address, phone numbers, address, emergency contact and
            the cohort you join. While you study: your attendance, your quiz and final exam scores, and any comments you give
            about a class.
          </p>
        </Section>

        <Section title="Why we use it">
          <p>
            To enrol you, run classes and assessments, record your progress, decide graduation and issue your certificate, and
            to send you your welcome email and course manual. We do not sell your information or use it for advertising.
          </p>
        </Section>

        <Section title="Who can see it">
          <ul className="list-disc pl-5 space-y-1">
            <li>Teachers can see your name, photo, scores and attendance. They cannot see your contact details.</li>
            <li>School administrators can also see your contact details, and can issue certificates.</li>
            <li>Students cannot see other students&apos; information. Written class comments are kept anonymous.</li>
            <li>
              Our hosting and database provider (Supabase) and our email service store and send data for us under their own
              security terms. We share your information with no one else unless the law requires it.
            </li>
          </ul>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your record for {RETENTION_YEARS} years after your course ends, so that your certificate can be verified.
            After that it is deleted or made anonymous. Passport photographs are removed at the same time.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You may ask to see the information we hold about you, to correct it, to have it deleted, to restrict how we use it,
            or to withdraw your consent. We reply within {RESPONSE_DAYS} days. We may ask you to prove who you are first, and
            we may keep what the law requires us to keep. If you are not happy with our answer you may complain to the Nigeria
            Data Protection Commission.
          </p>
        </Section>

        <Section title="How to make a request">
          {email ? (
            <p>
              Email{' '}
              <a className="font-semibold text-ink-950 underline" href={`mailto:${email}`}>
                {email}
              </a>{' '}
              with your full name and matric number (if you have one) and say what you need.
            </p>
          ) : (
            <p>Contact the school office with your full name and matric number (if you have one) and say what you need.</p>
          )}
        </Section>

        <Section title="How we protect it">
          <p>
            Access is limited to signed-in staff with the right role. Passport photographs and the course manual are kept in
            private storage. Changes to scores and attendance are recorded in an audit log. Connections use HTTPS.
          </p>
        </Section>
      </div>
    </main>
  );
}
