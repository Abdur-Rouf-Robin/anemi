import { LegalPage } from "../legal/page-shell";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      body={[
        "We store your email, display name, watch progress, list status, comments, and optional MFA secret.",
        "Playback position stays on the server so continue watching works across devices.",
        "Newsletter signup is optional and only used for schedule notes you asked for."
      ]}
    />
  );
}
