# Awards Night — voting site

Three static pages that talk to the gala backend (same Render service and Supabase project, so **no new subscriptions**):

- `index.html` — voters (phones). Matric number, pick nominees, review, submit.
- `results.html` — the big screen. Shows only the winners you reveal.
- `admin.html` — organiser. Set up, open/close voting, reveal winners.

## The rules it enforces
- Only matric numbers on the voter list can vote.
- **One ballot per matric number, enforced by the database itself** (a unique constraint), not by this website. A second attempt is refused even if someone bypasses the page with a script.
- A ballot is saved all-or-nothing. Skipping every category still counts as having voted.
- Votes are final. Categories lock once voting opens. Winners can only be revealed after voting is closed, and nothing about results is public until you reveal it.

## Setup (once)
1. **Supabase** — run `sql/voting.sql` (from the backend zip) in the SQL Editor.
2. **Backend (Render)** — deploy the updated backend and add the environment variable `VOTING_ADMIN_KEY` (a long random string; keep it to the organisers).
3. **This site** — edit `config.js` and put your backend's address in `window.VOTING_API_BASE`.
4. Push this folder to a new GitHub repo and turn on GitHub Pages (Settings → Pages → deploy from `main`, root). It holds no secrets.

## Running the night
1. Open `admin.html`, sign in with `VOTING_ADMIN_KEY`.
2. Paste the **categories** (`# Category` line, then one nominee per line) and the **voter list** (`matric number, full name` per line, pasting from Excel works).
3. **Open voting.** Share the link to `index.html`.
4. Watch turnout; the screen lists who hasn't voted yet.
5. **Close voting**, put `results.html` on the projector, and press **Reveal on screen** one category at a time.

## Before the real night: do a rehearsal
Rehearse with the real pages, but remember a rehearsal "uses up" matric numbers. Afterwards, run this in the Supabase SQL Editor to wipe the rehearsal and return to draft:

    delete from voting_votes where true;
    update voting_categories set revealed = false, revealed_at = null where true;
    update voting_settings set status = 'draft' where id = 1;

Then re-save your real categories. **Never run this after the real voting has started.**

## Know the limits
- **A matric number is not a secret.** Anyone who knows a classmate's number could vote as them before they do. The voter list stops outsiders and made-up numbers, not classmates impersonating each other. If that matters, the stronger fix is a one-time code emailed to each voter's address on file. It can be added.
- **Votes are stored against matric numbers** (needed to stop repeats). The organiser screens only show totals and who hasn't voted, never who voted for whom, but someone with direct database access could look.
- **Free hosting sleeps.** The first request after a quiet spell can take about a minute (voters see a "server is waking up" message). Use the paid Render plan for the event month, or ping `/api/health` every few minutes.
