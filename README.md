# X Corp neobank prototype

A clickable prototype of a neobank (X Corp) running on top of IndusInd Bank. It shows the complete journey a business goes through, from opening an account to making a payment that several checkers authorise on a secure bank window.

Everything runs in the browser on sample data (saved in `localStorage`); there is no backend.

## Run it

```bash
corepack enable
pnpm install
pnpm dev
```

Open http://localhost:8443. Use **Log in as** at the top right of the home page; every sign-in panel lists its demo credentials.

## The journey

1. **Apply** (public, `/apply`): a business fills a five-step application. *Fill sample data* completes it.
2. **X Corp reviews** (NeoBank Admin, Applications): verify and send to the bank, or reject with a reason.
3. **IndusInd Bank approves** (Bank Admin, Applications): approving opens the account and activates the business.
4. **Track** (public, `/track`): the applicant checks progress with their reference and email, and collects the logins for their team.
5. **Business Banking** (Maker, Checker 1, Checker 2): add beneficiaries and make payments. A maker prepares; checkers authorise in any order.
6. **Authorise on the bank window**: each checker signs in to the IndusInd Bank window (credentials plus OTP `123456`), sees only that transaction, and approves. The payment moves on once every required checker has approved.

Rules built in: a rejection cancels the transaction for good; a maker can cancel before any checker acts; an unfinished bank window can be resumed; sessions expire after 10 minutes; a new beneficiary is limited to ₹10,000 for the first hour.

## Code map

- `src/features` screens grouped by area (authentication, onboarding, payments, beneficiaries, approvals, dashboard, audit, mop)
- `src/portals` layouts per portal and the bank authorisation window
- `src/services` the business logic, run against `mockDatabase`
- `src/mock-data` seed data; bump `DATABASE_VERSION` in `src/services/mockDatabase.ts` to reset everyone's browser data
