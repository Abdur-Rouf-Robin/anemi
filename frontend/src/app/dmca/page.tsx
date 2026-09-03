import { LegalPage } from "../legal/page-shell";

export default function DmcaPage() {
  return (
    <LegalPage
      title="DMCA"
      body={[
        "Anemi is meant for your own or licensed files. If you believe a title infringes your copyright, contact the operator with the title slug, a description of the work, and your contact details.",
        "We will review the report and remove material we cannot verify as licensed."
      ]}
    />
  );
}
