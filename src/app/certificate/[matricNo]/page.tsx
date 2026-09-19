'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer, Award, AlertCircle } from 'lucide-react';
import { getCertificateByMatricAction } from '@/actions/broadsheet';
import { getHonourBadgeDetails } from '@/lib/certificate';
import type { CertificateDetails } from '@/types/broadsheet';

export default function CertificatePrintPage() {
  const params = useParams();
  const rawMatric = params?.matricNo as string;
  const [cert, setCert] = useState<CertificateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawMatric) return;

    const fetchCert = async () => {
      setLoading(true);
      const res = await getCertificateByMatricAction(rawMatric);
      if (res.success && res.certificate) {
        setCert(res.certificate);
      } else {
        setError(res.error || 'Certificate not found or not yet issued.');
      }
      setLoading(false);
    };

    fetchCert();
  }, [rawMatric]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <Award className="w-10 h-10 text-solar-500 animate-spin mb-3" />
        <span className="text-sm font-semibold text-ink-600">
          Loading official graduation certificate...
        </span>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-heading font-black text-ink-950 mb-2">
          Certificate Unavailable
        </h1>
        <p className="text-xs text-ink-500 max-w-sm mb-6 leading-relaxed">
          {error || 'This student has not yet been cleared or issued a graduation certificate.'}
        </p>
        <Link
          href="/admin/broadsheet"
          className="px-4 py-2 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-800 transition-colors"
        >
          Return to Broadsheet
        </Link>
      </div>
    );
  }

  const honour = getHonourBadgeDetails(cert.honourClass);

  return (
    <div className="min-h-screen bg-canvas text-ink-950 print:bg-white print:p-0">
      {/* Screen Toolbar - Hidden during print */}
      <nav className="border-b border-ink-200 bg-surface px-4 py-3 sticky top-0 z-30 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/admin/broadsheet"
            className="flex items-center gap-2 text-xs font-semibold text-ink-600 hover:text-ink-950"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Broadsheet</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-500 font-mono hidden sm:inline">
              Certificate: <strong>{cert.certificateNo}</strong>
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-solar-600 text-white text-xs font-bold hover:bg-solar-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="p-4 sm:p-8 md:p-12 flex justify-center print:p-0">
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: landscape;
              margin: 0;
            }
            @media print {
              body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .certificate-container {
                box-shadow: none !important;
                border-width: 8px !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 2.5rem !important;
                page-break-inside: avoid !important;
              }
            }
          `
        }} />

        <div className="certificate-container w-full max-w-4xl bg-white border-8 border-double border-solar-600 p-8 sm:p-14 shadow-2xl relative text-center rounded-sm overflow-hidden flex flex-col justify-between aspect-[1.414/1]">
          {/* Gold Corner Accents */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-solar-600" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-solar-600" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-solar-600" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-solar-600" />

          {/* Top Header */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] text-solar-700 block">
              Citizens of Light Church
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink-950 tracking-wider uppercase">
              Citizens Elementary School
            </h1>
            <p className="text-xs sm:text-sm text-ink-500 italic">
              Foundations of Faith, Doctrine & Discipleship Training
            </p>
          </div>

          {/* Ribbon */}
          <div className="my-3 flex items-center justify-center gap-4">
            <div className="h-[1.5px] w-20 bg-solar-400" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-ink-700">
              Certificate of Graduation
            </span>
            <div className="h-[1.5px] w-20 bg-solar-400" />
          </div>

          {/* Certify Text */}
          <div className="space-y-3 my-auto">
            <p className="text-xs sm:text-sm text-ink-600 tracking-wide">
              This is to officially certify that
            </p>

            {/* Candidate Name */}
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-solar-900 tracking-tight my-2 underline decoration-solar-400 decoration-2 underline-offset-8">
              {cert.studentName}
            </h2>

            <p className="text-xs sm:text-sm text-ink-600 max-w-xl mx-auto leading-relaxed pt-2">
              having fulfilled all prescribed requirements, completed the modular doctrinal assessments,
              and satisfied continuous institutional attendance, is hereby awarded this certificate for the{' '}
              <strong className="text-ink-950 font-bold">{cert.cohortName}</strong>.
            </p>

            {/* Honour Seal */}
            <div className="pt-2">
              <span className="inline-block px-5 py-1.5 rounded-full border-2 border-solar-500 bg-solar-50 text-solar-900 font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xs">
                Graduated with {cert.honourClass}
              </span>
              <p className="text-[11px] text-ink-400 mt-1">
                Cumulative Score: {cert.cumulativeTotal.toFixed(1)} / 100 ({honour.description})
              </p>
            </div>
          </div>

          {/* Signatures & Footer Details */}
          <div className="pt-6">
            <div className="grid grid-cols-2 gap-12 pb-6 border-t border-ink-200">
              {/* Pastor Signature */}
              <div className="text-center">
                <div className="h-12 border-b border-ink-400 max-w-[200px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic text-sm text-ink-700 font-medium">
                    Pastor In Charge
                  </span>
                </div>
                <span className="text-xs font-bold text-ink-900 block mt-1.5">
                  Senior Pastorate
                </span>
                <span className="text-[10px] text-ink-500">Citizens of Light Church</span>
              </div>

              {/* Director Signature */}
              <div className="text-center">
                <div className="h-12 border-b border-ink-400 max-w-[200px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic text-sm text-ink-700 font-medium">
                    Director of Studies
                  </span>
                </div>
                <span className="text-xs font-bold text-ink-900 block mt-1.5">
                  Academic Directorate
                </span>
                <span className="text-[10px] text-ink-500">Citizens Elementary School</span>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="border-t border-ink-100 pt-3 flex items-center justify-between text-[11px] text-ink-400 font-mono">
              <span>
                Cert No: <strong className="text-ink-700">{cert.certificateNo}</strong>
              </span>
              <span>
                Matric No: <strong className="text-ink-700">{cert.matricNo}</strong>
              </span>
              <span>
                Issue Date: <strong className="text-ink-700 font-sans">{cert.formattedIssuedDate}</strong>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
