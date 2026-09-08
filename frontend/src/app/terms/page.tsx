import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" blurb="Clear rules for using Anemi, including accounts, acceptable use, and rights-holder processes.">
      <LegalSection title="1. Acceptance of Terms">
        <p>
          These Terms govern access to Anemi (the “Service”). By using the Service you agree to them. If you do not agree, do not use the
          Service.
        </p>
        <p>We may update these Terms and will change the page when we do. Continued use after an update means you accept the new Terms.</p>
      </LegalSection>
      <LegalSection title="2. Eligibility & Children" kicker="Age">
        <p>You must be at least 13 years old. If you are under the age of majority where you live, you need a parent or guardian’s consent.</p>
        <p>The Service is not directed to children under 13. Contact us if you believe a child under 13 created an account.</p>
      </LegalSection>
      <LegalSection title="3. Accounts & Security" kicker="Keep your credentials secure">
        <ul>
          <li>Do not share your password or session with anyone.</li>
          <li>You are responsible for activity on your account.</li>
          <li>Tell the operator promptly if you suspect unauthorized access.</li>
          <li>Provide accurate information. Do not create accounts with automation or impersonate others.</li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Catalog & License" kicker="What Anemi hosts">
        <p>
          Anemi is a catalog and player for video the operator owns or licenses. It is not a scrape of other websites and does not embed
          third-party stream servers. Content availability can change as licenses change.
        </p>
        <p>
          We grant you a limited, personal, non-transferable license to watch published titles on the Service for lawful, non-commercial
          entertainment.
        </p>
      </LegalSection>
      <LegalSection title="5. Prohibited Conduct" kicker="Rules">
        <ul>
          <li>Do not use bots, scrapers, or automated means to extract data without written permission.</li>
          <li>Do not bypass access controls, rate limits, or content protection.</li>
          <li>Do not redistribute or re-upload Service files outside the Service.</li>
          <li>Do not harass others or post unlawful content.</li>
        </ul>
        <p>We may remove content, restrict features, or close accounts that break these Terms.</p>
      </LegalSection>
      <LegalSection title="6. Suspension &amp; Termination">
        <p>
          Access may be suspended or ended if we reasonably believe you violated these Terms, pose a security risk, or we must comply with
          law. You may stop using the Service at any time.
        </p>
      </LegalSection>
      <LegalSection title="7. Disclaimers">
        <p>
          To the maximum extent permitted by law, the Service is provided “as is” and “as available,” without warranties of merchantability,
          fitness for a particular purpose, or non-infringement.
        </p>
      </LegalSection>
      <LegalSection title="8. Contact">
        <p>
          Questions about these Terms: use the <Link href="/contact">contact form</Link>. Rights-holder takedowns: see{" "}
          <Link href="/dmca">DMCA</Link>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
