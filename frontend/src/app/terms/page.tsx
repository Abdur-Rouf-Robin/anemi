import { LegalPage } from "../legal/page-shell";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      body={[
        "Use Anemi only with media you have the right to host. Do not upload or link other people’s copyrighted files.",
        "Accounts are for the people who create them. Do not share admin access.",
        "We may remove titles, comments, or rooms that break these terms."
      ]}
    />
  );
}
