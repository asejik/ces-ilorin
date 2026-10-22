import Image from 'next/image';
import { UploadCloud, User } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { SectionCard } from './section-card';

export function PhotoSection({
  photoPreview,
  hasPhoto,
  onPhotoChange,
}: {
  photoPreview: string | null;
  hasPhoto: boolean;
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <SectionCard icon={UploadCloud} title="5. Passport Photograph Upload">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-ink-300 bg-canvas flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          {photoPreview ? (
            <Image src={photoPreview} alt="Passport Preview" fill className="object-cover" />
          ) : (
            <div className="text-center p-2 text-ink-400">
              <User className="w-8 h-8 mx-auto mb-1 opacity-50" />
              <span className="text-[10px] block">No Photo</span>
            </div>
          )}
        </div>

        <div className="flex-1 w-full">
          <label
            htmlFor="passport_input"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-ink-300 bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink-950 cursor-pointer transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-solar-600" />
            {hasPhoto ? 'Change Passport Photo' : 'Select Passport Photo (JPG/PNG)'}
          </label>
          <input
            id="passport_input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPhotoChange}
            className="hidden"
          />
          <p className="text-xs text-ink-500 mt-2">
            Please upload a clear, front-facing passport photograph with a light background (Max 3MB).
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
