# Newsletter runbook (#197)

How `rsicarelli.com` does the newsletter: **Buttondown** (double opt-in), wired so there is **no
third-party JavaScript or cookie** on the site — our own form posts to a Cloudflare Pages Function
(`/api/subscribe`) that calls the Buttondown API **server-side** with a secret key. Privacy disclosure
is on `/en/privacy` + `/pt-br/privacy` (#193); rationale in `docs/engagement-strategy.md`.

## Architecture

| Concern   | Choice                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| Form      | our own bilingual `<form>` in the footer — env-gated on `PUBLIC_NEWSLETTER_ENABLED`   |
| Transport | same-origin `POST /api/subscribe` (CSP `form-action`/`connect-src` are `'self'`)      |
| Provider  | **Buttondown** API, called **server-side** from the Pages Function (key is a secret)  |
| Opt-in    | **double opt-in** (Buttondown sends confirm + welcome; address joins only on confirm) |
| No-JS     | the form still works — the function 303-redirects to `/<locale>/subscribe`            |
| Anti-spam | honeypot (`website`) + double opt-in + same-origin guard (no Turnstile)               |
| Cookies   | **none**, no client storage, no third-party JS → no consent banner                    |

Already wired in-repo: `NewsletterSignup.astro` (footer), `functions/api/subscribe.ts` +
`functions/_lib/subscribe.ts`, the `subscribe` thank-you page, the CSP hash for the inline
enhancement, and the privacy disclosure. Nothing renders/works until the steps below are done.

## Provisioning (owner-only)

1. **Create a [Buttondown](https://buttondown.com) account.** In **Settings → Subscriptions**, enable
   **"confirm subscriptions" (double opt-in)**.
2. **Customize the emails** (Settings): the **confirmation** email and the **welcome** email. Add a
   line inviting people to **reply directly to this email** (it builds correspondents).
3. **Copy the API key** (Settings → Programming / API).
4. **Set the env in Cloudflare Pages** → **Settings → Variables and Secrets**, for **Production AND
   Preview**:
   - `BUTTONDOWN_API_KEY` = the key — **type Secret** (read server-side by the function; never `PUBLIC_*`).
   - `PUBLIC_NEWSLETTER_ENABLED` = `true` — **type Text** (gates the footer form's render).
5. **(Recommended) Add a WAF rate-limit rule** for `/api/subscribe` (Security → WAF → Rate limiting
   rules): e.g. **> 10 requests / minute / IP → Block** — caps subscription-bombing volume.
6. **Redeploy** and verify on a deployed preview: the footer shows the signup form; submitting a real
   address triggers a Buttondown **confirmation email**; the address only appears in Buttondown once
   you click confirm. With the vars unset (dev/CI), the form is not rendered at all (asserted by
   `tests/seo/newsletter.test.ts`).

## Notes

- **Free tier** is ~100 subscribers, then paid — revisit the provider if the list grows.
- The Buttondown specifics are isolated in `functions/api/subscribe.ts`; swapping ESPs later is a small
  change (different URL/auth/body), with no front-end changes.
- The endpoint never reveals whether an address is already subscribed (returns success either way) and
  never echoes Buttondown's error body — no account enumeration.
