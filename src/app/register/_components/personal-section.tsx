import { User } from 'lucide-react';
import { SectionCard } from './section-card';
import { SelectField, TextField, type FieldChangeHandler } from './form-fields';
import type { RegistrationFields } from './registration-fields';

export function PersonalSection({
  values,
  onChange,
}: {
  values: RegistrationFields;
  onChange: FieldChangeHandler;
}) {
  return (
    <SectionCard icon={User} title="2. Personal Information">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField label="Surname" name="surname" required placeholder="e.g. Adeyemi" value={values.surname} onChange={onChange} />
        <TextField label="First Name" name="first_name" required placeholder="e.g. David" value={values.first_name} onChange={onChange} />
        <TextField label="Middle Name" name="middle_name" placeholder="e.g. Oluwaseun" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <SelectField
          label="Gender"
          name="gender"
          required
          placeholder="Select Gender"
          value={values.gender}
          onChange={onChange}
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
          ]}
        />
        <SelectField
          label="Marital Status"
          name="marital_status"
          required
          placeholder="Select Status"
          value={values.marital_status}
          onChange={onChange}
          options={[
            { value: 'Single', label: 'Single' },
            { value: 'Married', label: 'Married' },
            { value: 'Widowed', label: 'Widowed' },
            { value: 'Divorced', label: 'Divorced' },
          ]}
        />
        <TextField label="Educational Level" name="educational_level" placeholder="e.g. BSc, HND, OND, SSCE" />
      </div>

      <TextField
        label="Occupation"
        name="occupation"
        placeholder="e.g. Civil Servant, Educator, Entrepreneur, Student"
      />
    </SectionCard>
  );
}
