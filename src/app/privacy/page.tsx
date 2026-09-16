import Link from "next/link";
import { paymentGateEnabled } from "@/lib/export-access";
import { connection } from "next/server";
export default async function Privacy() {
  await connection();
  const gate = paymentGateEnabled();
  return (
    <main className="container legal-page">
      <div className="eyebrow">A NETWORK BUILT ON TRUST</div>
      <h1>
        Your details.
        <br />
        <span className="highlight">Handled with care.</span>
      </h1>
      <p>
        This is an unofficial participant initiative for Eureka 2026 zonals,
        made by an anonymous participant. It is not operated or endorsed by IIT
        Bombay or the Eureka organisers.
      </p>
      <h2>What you choose to share</h2>
      <p>
        Publishing a profile shares the information you enter, including your
        name, role, photo, emails, phone number, company details, location, and
        links, with signed-in network members. These members can view profiles,
        save contact cards, and download directory snapshots when exports are
        available. Do not submit confidential material or details belonging to
        someone else without permission.
      </p>
      <h2>Login and storage</h2>
      <p>
        Clerk handles account authentication. Supabase stores published profiles
        and photos.{" "}
        {gate
          ? "Your account identifier links your profile and download entitlement."
          : "Your account identifier links your profile."}{" "}
        Photos and directory data are served only after authentication.
        Membership is based on sign-in, and does not verify zonal qualification.
      </p>
      <h2>{gate ? "Downloads and the planned fee" : "Directory downloads"}</h2>
      <p>
        {gate &&
          "The planned one-time ₹9 fee will unlock future downloads on the same account. "}
        Each CSV is a snapshot generated when downloaded; saved files do not
        update automatically.
        {gate
          ? " Charging a fee cannot technically prevent onward sharing."
          : " Please keep shared information within this network."}
      </p>
      <h2>Edit or withdraw</h2>
      <p>
        You can edit or remove your profile from the My profile page. Removal
        deletes your published profile and photo from the directory. It cannot
        recall contact cards, QR images, or CSV copies that someone has already
        saved.{" "}
        {gate
          ? "Your Clerk login account and any purchase records are separate;"
          : "Your Clerk login account is separate;"}{" "}
        use the account menu to manage your login account.
      </p>
      <h2>Community rules</h2>
      <p>
        Use shared details for relevant, respectful networking. Do not publish
        or resell the directory, forward it outside this community, scrape it,
        send unsolicited bulk messages, or impersonate a participant. Only
        publish information you have permission to share. Business claims are
        self-reported.
      </p>
      <Link className="button yellow" href="/profile/edit">
        Manage my profile ↗
      </Link>
    </main>
  );
}
