import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminRole } from "./auth";
import {
  createExpectedGuest,
  createParty,
  createRsvp,
  deleteExpectedGuest,
  deleteParty,
  deleteRsvp,
  logout,
  updateExpectedGuest,
  updateParty,
  updateRsvp,
} from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Guest ledger — Hiruni & Ravindu" };

type Tab = "expected" | "rsvp" | "confirmed" | "parties";
type GuestOption = { id: string; name: string; party: { name: string } };
type ResponseRecord = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  attending: boolean;
  whoAttending: "ONLY_MYSELF" | "MYSELF_AND_OTHER_INVITEES" | "COMPLICATED" | null;
  guestCount: number;
  expectedGuestId: string | null;
  message: string | null;
};

const attendanceLabels = {
  ONLY_MYSELF: "Only myself",
  MYSELF_AND_OTHER_INVITEES: "With other invitees",
  COMPLICATED: "Complicated",
} as const;

function RsvpFields({
  response,
  guests,
  returnTab,
  defaultGuest,
  defaultName,
  defaultCount = 1,
}: {
  response?: ResponseRecord;
  guests: GuestOption[];
  returnTab: Tab;
  defaultGuest?: string;
  defaultName?: string;
  defaultCount?: number;
}) {
  return (
    <div className="admin-form-grid">
      <input type="hidden" name="returnTab" value={returnTab} />
      <label>Full name<input name="fullName" defaultValue={response?.fullName ?? defaultName ?? ""} required maxLength={120} /></label>
      <label>Phone<input name="phoneNumber" type="tel" defaultValue={response?.phoneNumber ?? "+94"} required /></label>
      <label>Email<input name="email" type="email" defaultValue={response?.email ?? ""} /></label>
      <label>Response
        <select name="attending" defaultValue={String(response?.attending ?? true)}>
          <option value="true">Attending</option>
          <option value="false">Declined</option>
        </select>
      </label>
      <label>Attendance group
        <select name="whoAttending" defaultValue={response?.whoAttending ?? "ONLY_MYSELF"}>
          {Object.entries(attendanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>Actual guests<input name="guestCount" type="number" min="0" max="9999" defaultValue={response?.guestCount ?? defaultCount} required /></label>
      <label className="admin-span-2">Match to invitation
        <select name="expectedGuestId" defaultValue={response?.expectedGuestId ?? defaultGuest ?? ""}>
          <option value="">Unmatched</option>
          {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name} — {guest.party.name}</option>)}
        </select>
      </label>
      <label className="admin-span-2">Message<textarea name="message" rows={2} defaultValue={response?.message ?? ""} maxLength={1000} /></label>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="admin-empty"><span aria-hidden="true">◇</span><p>{children}</p></div>;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await getAdminRole();

  if (!role) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <p className="admin-kicker">Hiruni &amp; Ravindu</p>
          <div className="admin-monogram" aria-hidden="true">H<span>&amp;</span>R</div>
          <h1>Guest ledger</h1>
          <p>Enter the admin password to manage invitations and responses.</p>
          <LoginForm />
          <Link href="/">← Return to invitation</Link>
        </section>
      </main>
    );
  }

  const query = await searchParams;
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const allowedTabs: Tab[] = role === "super" ? ["expected", "rsvp", "confirmed", "parties"] : ["expected", "rsvp", "confirmed"];
  const tab: Tab = allowedTabs.includes(requestedTab as Tab) ? requestedTab as Tab : "expected";
  const notice = Array.isArray(query.notice) ? query.notice[0] : query.notice;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  const [parties, expectedGuests, responses] = await Promise.all([
    prisma.invitingParty.findMany({
      include: { expectedGuests: { include: { rsvp: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.expectedGuest.findMany({
      include: { party: true, rsvp: true },
      orderBy: [{ party: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.rsvp.findMany({
      include: { expectedGuest: { include: { party: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const guestOptions: GuestOption[] = expectedGuests.map(({ id, name, party }) => ({ id, name, party }));
  const totalInvited = expectedGuests.reduce((sum, guest) => sum + guest.invitedPersons, 0);
  const totalConfirmed = responses.reduce((sum, response) => sum + (response.attending ? response.guestCount : 0), 0);
  const unmatchedResponses = responses.filter((response) => !response.expectedGuestId);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Wedding operations · 14 December 2026</p>
          <h1>Guest ledger</h1>
          <p>{expectedGuests.length} invitations · {totalInvited} invited · {totalConfirmed} confirmed</p>
        </div>
        <div className="admin-header-actions">
          <span className="admin-role">{role === "super" ? "Super admin" : "Admin"}</span>
          <form action={logout}><button className="admin-quiet-button" type="submit">Sign out</button></form>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        <a className={tab === "expected" ? "active" : ""} href="?tab=expected">Expected guests <span>{expectedGuests.length}</span></a>
        <a className={tab === "rsvp" ? "active" : ""} href="?tab=rsvp">RSVP <span>{responses.length}</span></a>
        <a className={tab === "confirmed" ? "active" : ""} href="?tab=confirmed">Confirmed guests <span>{totalConfirmed}</span></a>
        {role === "super" && <a className={tab === "parties" ? "active" : ""} href="?tab=parties">Inviting parties <span>{parties.length}</span></a>}
      </nav>

      {notice && <p className="admin-alert success" role="status">{notice}</p>}
      {error && <p className="admin-alert error" role="alert">{error}</p>}

      {tab === "expected" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Invitation list</p><h2>Expected guests</h2></div>
            <details className="admin-create">
              <summary>Add expected guest</summary>
              <form action={createExpectedGuest}>
                <div className="admin-form-grid">
                  <label>Guest or family name<input name="name" required maxLength={120} /></label>
                  <label>Inviting party<select name="partyId" required defaultValue=""><option value="" disabled>Select a party</option>{parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>
                  <label>Invited persons<input name="invitedPersons" type="number" min="1" max="9999" defaultValue="1" required /></label>
                </div>
                <button type="submit" disabled={!parties.length}>Add guest</button>
                {!parties.length && <p className="admin-form-hint">A super admin must add an inviting party first.</p>}
              </form>
            </details>
          </div>

          {!expectedGuests.length ? <Empty>No expected guests yet. Add the first invitation above.</Empty> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Inviting party</th><th>Invited persons</th><th>RSVP</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{expectedGuests.map((guest) => (
                  <tr key={guest.id}>
                    <td className="admin-primary-cell">{guest.name}</td>
                    <td>{guest.party.name}</td>
                    <td>{guest.invitedPersons}</td>
                    <td><span className={`admin-status ${guest.rsvp?.attending ? "yes" : guest.rsvp ? "no" : "waiting"}`}>{guest.rsvp?.attending ? `${guest.rsvp.guestCount} confirmed` : guest.rsvp ? "Declined" : "Awaiting"}</span></td>
                    <td>
                      <details className="admin-row-menu"><summary>Edit</summary>
                        <form action={updateExpectedGuest.bind(null, guest.id)}>
                          <label>Name<input name="name" defaultValue={guest.name} required /></label>
                          <label>Party<select name="partyId" defaultValue={guest.partyId}>{parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>
                          <label>Invited persons<input name="invitedPersons" type="number" min="1" defaultValue={guest.invitedPersons} required /></label>
                          <div className="admin-form-actions"><button type="submit">Save changes</button><button className="danger" formAction={deleteExpectedGuest.bind(null, guest.id)}>Delete</button></div>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "rsvp" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Landing page responses</p><h2>RSVP responses</h2></div>
            <details className="admin-create"><summary>Add response</summary><form action={createRsvp}><RsvpFields guests={guestOptions} returnTab="rsvp" /><button type="submit">Add response</button></form></details>
          </div>

          {!responses.length ? <Empty>No RSVP responses have been received yet.</Empty> : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-rsvp-table">
                <thead><tr><th>Guest</th><th>Response</th><th>Invitation</th><th>Guests</th><th>Message</th><th>Received</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{responses.map((response) => (
                  <tr key={response.id}>
                    <td className="admin-primary-cell">{response.fullName}<small>{response.phoneNumber}{response.email ? ` · ${response.email}` : ""}</small></td>
                    <td><span className={`admin-status ${response.attending ? "yes" : "no"}`}>{response.attending ? "Attending" : "Declined"}</span><small>{response.whoAttending ? attendanceLabels[response.whoAttending] : "—"}</small></td>
                    <td>{response.expectedGuest ? <>{response.expectedGuest.name}<small>{response.expectedGuest.party.name}</small></> : <span className="admin-status waiting">Unmatched</span>}</td>
                    <td>{response.guestCount}</td>
                    <td className="admin-message">{response.message || "—"}</td>
                    <td>{response.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td><details className="admin-row-menu wide"><summary>Edit</summary><form action={updateRsvp.bind(null, response.id)}><RsvpFields response={response} guests={guestOptions} returnTab="rsvp" /><div className="admin-form-actions"><button type="submit">Save changes</button><button className="danger" formAction={deleteRsvp.bind(null, response.id)}>Delete</button></div></form></details></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "confirmed" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Live reconciliation</p><h2>Confirmed guests</h2></div>
            <details className="admin-create"><summary>Record confirmation</summary><form action={createRsvp}><RsvpFields guests={guestOptions} returnTab="confirmed" /><button type="submit">Record confirmation</button></form></details>
          </div>

          <div className="admin-party-totals">
            {parties.map((party) => {
              const invited = party.expectedGuests.reduce((sum, guest) => sum + guest.invitedPersons, 0);
              const confirmed = party.expectedGuests.reduce((sum, guest) => sum + (guest.rsvp?.attending ? guest.rsvp.guestCount : 0), 0);
              return <article key={party.id} className={confirmed > party.maxGuestCount ? "over" : ""}><p>{party.name}</p><strong>{confirmed}</strong><span>confirmed · {invited} invited · max {party.maxGuestCount}</span>{confirmed > party.maxGuestCount && <em>{confirmed - party.maxGuestCount} over limit</em>}</article>;
            })}
            {!parties.length && <Empty>No inviting parties have been created.</Empty>}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Expected guest</th><th>Party</th><th>Invited</th><th>Response</th><th>Actual guests</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{expectedGuests.map((guest) => (
                <tr key={guest.id}>
                  <td className="admin-primary-cell">{guest.name}</td><td>{guest.party.name}</td><td>{guest.invitedPersons}</td>
                  <td>{guest.rsvp ? <><span className={`admin-status ${guest.rsvp.attending ? "yes" : "no"}`}>{guest.rsvp.attending ? "Confirmed" : "Declined"}</span><small>{guest.rsvp.fullName}</small></> : <span className="admin-status waiting">Awaiting</span>}</td>
                  <td className={guest.rsvp && guest.rsvp.guestCount > guest.invitedPersons ? "admin-over-count" : ""}>{guest.rsvp?.guestCount ?? "—"}</td>
                  <td>{guest.rsvp ? (
                    <details className="admin-row-menu wide"><summary>Edit</summary><form action={updateRsvp.bind(null, guest.rsvp.id)}><RsvpFields response={guest.rsvp} guests={guestOptions} returnTab="confirmed" /><div className="admin-form-actions"><button type="submit">Save changes</button><button className="danger" formAction={deleteRsvp.bind(null, guest.rsvp.id)}>Delete</button></div></form></details>
                  ) : (
                    <details className="admin-row-menu wide"><summary>Confirm</summary><form action={createRsvp}><RsvpFields guests={guestOptions} returnTab="confirmed" defaultGuest={guest.id} defaultName={guest.name} defaultCount={guest.invitedPersons} /><button type="submit">Record confirmation</button></form></details>
                  )}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {unmatchedResponses.length > 0 && <div className="admin-unmatched"><h3>Unmatched responses</h3><p>Match these responses to an invitation to include them in a party total.</p>{unmatchedResponses.map((response) => <article key={response.id}><div><strong>{response.fullName}</strong><span>{response.attending ? `${response.guestCount} attending` : "Declined"} · {response.phoneNumber}</span></div><details className="admin-row-menu wide"><summary>Reconcile</summary><form action={updateRsvp.bind(null, response.id)}><RsvpFields response={response} guests={guestOptions} returnTab="confirmed" /><div className="admin-form-actions"><button type="submit">Save match</button><button className="danger" formAction={deleteRsvp.bind(null, response.id)}>Delete</button></div></form></details></article>)}</div>}
        </section>
      )}

      {tab === "parties" && role === "super" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Super admin</p><h2>Inviting party management</h2></div>
            <details className="admin-create"><summary>Add inviting party</summary><form action={createParty}><div className="admin-form-grid"><label>Party name<input name="name" required maxLength={120} /></label><label>Maximum guests<input name="maxGuestCount" type="number" min="0" max="9999" required /></label></div><button type="submit">Add party</button></form></details>
          </div>
          {!parties.length ? <Empty>No inviting parties yet. Add the first one above.</Empty> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Inviting party</th><th>Expected entries</th><th>Invited persons</th><th>Maximum guests</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{parties.map((party) => <tr key={party.id}><td className="admin-primary-cell">{party.name}</td><td>{party.expectedGuests.length}</td><td>{party.expectedGuests.reduce((sum, guest) => sum + guest.invitedPersons, 0)}</td><td>{party.maxGuestCount}</td><td><details className="admin-row-menu"><summary>Edit</summary><form action={updateParty.bind(null, party.id)}><label>Name<input name="name" defaultValue={party.name} required /></label><label>Maximum guests<input name="maxGuestCount" type="number" min="0" defaultValue={party.maxGuestCount} required /></label><div className="admin-form-actions"><button type="submit">Save changes</button><button className="danger" formAction={deleteParty.bind(null, party.id)}>Delete party</button></div><p className="admin-form-hint">Deleting a party also removes its expected guest entries. Matched RSVP responses remain unmatched.</p></form></details></td></tr>)}</tbody></table></div>}
        </section>
      )}
    </main>
  );
}
