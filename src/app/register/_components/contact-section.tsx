import { Phone } from 'lucide-react';
import { SectionCard } from './section-card';
import { TextAreaField, TextField, type FieldChangeHandler } from './form-fields';
import type { RegistrationFields } from './registration-fields';

export function ContactSection({
  values,
  onChange,
}: {
  values: RegistrationFields;
  onChange: FieldChangeHandler;
}) {
  return (
    <SectionCard icon={Phone} title="3. Contact Information">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField label="Phone Number" name="phone_number" type="tel" required placeholder="08012345678" value={values.phone_number} onChange={onChange} />
        <TextField label="WhatsApp Number" name="whatsapp_number" type="tel" placeholder="08012345678" />
        <TextField label="Email Address" name="email_address" type="email" required placeholder="name@example.com" value={values.email_address} onChange={onChange} />
      </div>

      <TextAreaField
        wrapperClassName="mb-4"
        label="Permanent Residential Address"
        name="permanent_address"
        placeholder="Full address in Ilorin or nearby"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Emergency Contact Name" name="emergency_contact" placeholder="Next of kin or guardian" />
        <TextField label="Emergency Contact Phone" name="emergency_contact_phone" type="tel" placeholder="08012345678" />
      </div>
    </SectionCard>
  );
}
