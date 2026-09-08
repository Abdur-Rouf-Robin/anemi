import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" blurb="How Anemi collects, uses, and protects account and playback data.">
      <LegalSection title="1. Overview">
        <p>
          This policy explains how Anemi (“we”, “us”) handles personal data when you use the site. Personal data is information that
          identifies you or your device.
        </p>
        <p>We do not sell personal data. We may use it to run the Service, prevent abuse, and meet legal duties.</p>
      </LegalSection>
      <LegalSection title="2. Categories of Data Collected" kicker="Account & profile">
        <ul>
          <li>Email, display name, password hash, and optional authenticator secret</li>
          <li>Profile extras you choose (avatar, banner, theme, playback preferences)</li>
          <li>Watch progress, list status, playlists, follows, comments, and requests</li>
          <li>Device and request logs used for security (IP, user agent, error traces)</li>
          <li>Cookies and local storage for session, CSRF, locale, and settings</li>
        </ul>
      </LegalSection>
      <LegalSection title="3. Purpose of Collection">
        <p>We use this data to sign you in, resume playback, remember lists, send the notifications you enabled, and keep the Service stable.</p>
      </LegalSection>
      <LegalSection title="4. Cookies & Local Storage" kicker="Essential">
        <p>Session cookies keep you signed in. Preference keys store theme and player options on this device. Disabling them will break sign-in.</p>
      </LegalSection>
      <LegalSection title="5. Sharing">
        <p>
          We do not rent or sell personal data. Email may pass through an SMTP provider for verification and password reset. Staff with CMS
          access can see account role and moderation reports as needed to operate the catalog.
        </p>
      </LegalSection>
      <LegalSection title="6. Retention">
        <p>Account data stays while the account is active. You can ask the operator to delete an account through the contact form.</p>
      </LegalSection>
      <LegalSection title="7. Your rights">
        <p>
          Depending on where you live you may request access, correction, or deletion. Use <Link href="/contact">Contact</Link> and we will
          verify the request.
        </p>
      </LegalSection>
      <LegalSection title="8. Children">
        <p>The Service is not directed to children under 13. Contact us if you believe a child under 13 provided personal data.</p>
      </LegalSection>
      <LegalSection title="9. Changes">
        <p>We will update this page when the policy changes.</p>
      </LegalSection>
    </LegalDoc>
  );
}
