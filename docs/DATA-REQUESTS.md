# Data requests and retention (NDPA 2023)

Public notice: `/privacy`. Contact address: set `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` in the hosting settings.
Retention: **5 years after the course ends**, then delete or anonymise. Reply to every request within **30 days**.
Values live in `src/lib/privacy.ts`; change them there and in this file together.

## Handling a request (an administrator does this)
1. **Log it**: date received, who, what they want. Keep the log outside this public repo.
2. **Check identity**: reply to the email address on their record (find them in Admin > Student Lookup) or ask for details only they would know. Never send personal data to an unverified address.
3. **Access**: open the student in Student Lookup and send the person their own details (profile, scores, attendance, certificate). Do not include other students' data or anonymous class comments.
4. **Correction**: contact details are corrected by an administrator in the database; scores and attendance only through the gradebook or the import (both audit-logged), with a reason.
5. **Deletion or withdrawn consent**: first confirm there is no reason to keep the record (for example a certificate that must stay verifiable). If deleting: mark `is_deleted = true`, remove the passport photo from the `ces-private` bucket, then blank the contact fields. Keep the matric number and certificate number so a certificate can still be verified, unless the person asks for full anonymisation.
6. **Reply** within 30 days and note the outcome in the log.

## Yearly retention review
Each January list students whose semester ended more than 5 years ago and delete or anonymise them as in step 5. Record the date done.

## Not yet automated
Export of one student's data and anonymisation are manual dashboard or SQL tasks. If requests become frequent, add an admin "Export student data" action.
