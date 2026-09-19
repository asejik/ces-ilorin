import nodemailer from 'nodemailer';

interface SendWelcomeEmailParams {
  to: string;
  studentName: string;
  matricNo: string;
  cohortType: string;
  manualUrl?: string;
}

/**
 * Creates nodemailer transport from environment variables or returns null if not configured
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE !== 'false';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Dispatches an automated welcome email to admitted students
 */
export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { to, studentName, matricNo, cohortType, manualUrl } = params;

  const safeName = escapeHtml(studentName);
  const safeMatric = escapeHtml(matricNo);
  const safeCohort = escapeHtml(cohortType);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ces.citizensoflightchurch.org';
  const effectiveManualUrl = manualUrl || `${appUrl}/manual.pdf`;
  const fromEmail =
    process.env.EMAIL_FROM || 'Citizens Elementary School <admissions@citizensoflightchurch.org>';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Citizens Elementary School</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0B0F19;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAECF0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(11, 15, 25, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0B0F19; padding: 30px; text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; margin-bottom: 4px;">
                Citizens Elementary School
              </div>
              <div style="font-size: 13px; color: #F59E0B; font-weight: 500;">
                Citizens of Light Church · Ilorin Center
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #0B0F19; margin-top: 0; margin-bottom: 12px;">
                Congratulations, ${safeName}!
              </h1>
              <p style="font-size: 15px; line-height: 24px; color: #475467; margin-top: 0; margin-bottom: 24px;">
                Your registration for the <strong>Citizens Elementary School (CES) Discipleship Training Programme</strong> has been successfully confirmed.
              </p>

              <!-- Matric Number Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 600; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                      Official Matriculation Number
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: #0B0F19; letter-spacing: 1px;">
                      ${safeMatric}
                    </div>
                    <div style="font-size: 13px; color: #92400E; margin-top: 6px;">
                      Assigned Cohort: <strong>${safeCohort}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <h2 style="font-size: 16px; font-weight: 700; color: #0B0F19; margin-bottom: 10px;">
                Important Programme Instructions:
              </h2>
              <ul style="font-size: 14px; line-height: 22px; color: #475467; padding-left: 20px; margin-bottom: 28px;">
                <li style="margin-bottom: 8px;"><strong>Keep your Matric Number safe:</strong> You will use <code>${safeMatric}</code> to access all class quizzes and examinations.</li>
                <li style="margin-bottom: 8px;"><strong>Class Attendance:</strong> Attendance in <em>Elementary Principles</em> and <em>Membership & Vision Class</em> is mandatory for graduation clearance.</li>
                <li style="margin-bottom: 8px;"><strong>Online Quizzes:</strong> At the conclusion of each course, your teacher will provide a Session PIN to take your quiz on the school portal.</li>
              </ul>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${effectiveManualUrl}" target="_blank" style="display: inline-block; background-color: #0B0F19; color: #FFFFFF; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 6px; box-shadow: 0 1px 2px rgba(11, 15, 25, 0.1);">
                      Download Instructional Course Manual
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #98A2B3; line-height: 20px; text-align: center; margin-bottom: 0;">
                If you have any questions or enquiries, please contact the CES Administrative Desk at the church center.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #EAECF0;">
              © ${new Date().getFullYear()} Citizens of Light Church, Ilorin. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const transporter = getEmailTransporter();

  // If no SMTP configured, log in development and return graceful success
  if (!transporter) {
    console.log(`[Email Service (Dev Mock)] Welcome email generated for ${to} (${matricNo})`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject: `Welcome to Citizens Elementary School — Your Matric No: ${matricNo}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Email Service] Failed to send welcome email:', errorMsg);
    // Don't throw; return status so caller can handle gracefully
    return { success: false, error: errorMsg };
  }
}
