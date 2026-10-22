import { Heart } from 'lucide-react';
import { SectionCard } from './section-card';
import {
  SelectField,
  TextAreaField,
  TextField,
  YES_NO_OPTIONS,
  type FieldChangeHandler,
} from './form-fields';
import type { RegistrationFields } from './registration-fields';

export function SpiritualSection({
  values,
  onChange,
}: {
  values: RegistrationFields;
  onChange: FieldChangeHandler;
}) {
  return (
    <SectionCard icon={Heart} title="4. Spiritual Journey & Church Life">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SelectField label="Are you Born Again?" name="born_again" required placeholder="Select" value={values.born_again} onChange={onChange} options={YES_NO_OPTIONS} />
        <SelectField
          label="Baptised in the Holy Spirit (with evidence of speaking in tongues)?"
          name="baptised_hs"
          required
          placeholder="Select"
          value={values.baptised_hs}
          onChange={onChange}
          options={YES_NO_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <TextField label="Years as a Christian" name="years_as_christian" placeholder="e.g. 5 years, 10 years" />
        <TextField label="Unit / Ministry of Interest" name="unit_of_interest" placeholder="e.g. Choir, Media, Ushering, Evangelism" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <TextField label="Previously served in any church department?" name="previously_served" placeholder="Yes / No (and department)" />
        <TextField label="Spiritual Gifts / Practical Skills" name="gifts_skills" placeholder="e.g. Teaching, Design, Sound, Counseling" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SelectField
          label="Have you attended Membership & Vision Class?"
          name="attended_mem_vision"
          required
          placeholder="Select"
          value={values.attended_mem_vision}
          onChange={onChange}
          options={YES_NO_OPTIONS}
        />
        <SelectField
          label="Committed to completing all sessions & quizzes?"
          name="committed_to_programme"
          required
          placeholder="Select"
          value={values.committed_to_programme}
          onChange={onChange}
          options={[
            { value: 'Yes', label: 'Yes, fully committed' },
            { value: 'No', label: 'No' },
          ]}
        />
      </div>

      <TextAreaField
        label="Comments or Enquiries"
        name="comments_enquiries"
        placeholder="Any special requests, comments, or expectations"
      />
    </SectionCard>
  );
}
