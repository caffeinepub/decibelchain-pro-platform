# DecibelChain PRO Platform

## Current State
Fully operational platform with 8 phases live. Sidebar navigation with ~35 pages. Dark navy/gold theme. Public read access everywhere. No dedicated campaign or industry education content exists.

## Requested Changes (Diff)

### Add
- New `industryHub` page: "Why DecibelChain" — a public-facing, high-impact campaign and education hub
- Three audience segment sections (tabbed), ordered:
  1. **Independent Artists & Songwriters** — lead segment, most urgency
  2. **Labels, Publishers & Producers** — revenue leakage, inaccurate numbers
  3. **Session Musicians & Supervisors** — underserved, FairerSplits™ etc.
- **Industry Stats Panel** with real publicly available data:
  - $2.65B+ in annual unclaimed "black box" royalties (CISAC reports)
  - CISAC 2023: $10.9B collected globally, 15-20% unmatched/undistributed
  - Average PRO payout delay: 12-18 months
  - Independent artists receive ~12% of total music revenue despite creating 40%+ of content (MIDiA Research)
  - Streaming payouts: $0.003–$0.005/stream (Spotify), with complex opaque split chains
  - 75% of songwriters say they cannot trace all their royalty streams (ASCAP surveys)
  - Session musicians typically receive 0% of backend master royalties unless negotiated
  - Sync licensing: 40-60% of deals never get fully reported back to composers
- **Case Studies** section with 4 real-world examples:
  1. Taylor Swift / masters ownership dispute — importance of controlling your catalog
  2. The "Black Box" funds problem — ASCAP/BMI/PRS holding hundreds of millions in unclaimed fees
  3. Session musician payouts — the unnamed contributors who built iconic records
  4. Prince's artist ownership campaign — "slave" to a label, fighting for his masters
- **NewWaysNow™ Feature Showcase** — three branded innovations:
  - **FairerSplits™** — transparent, on-chain split agreements, immutable and auditable
  - **InstaSplits™** — real-time royalty distribution the moment revenue is recognized, no 12-month delays
  - **BlackBoxSplits™** — proprietary algorithm to identify, claim, and route previously unmatched "black box" royalties to their rightful owners
- **Interactive Royalty Calculator** — user inputs monthly streams + PRO type, sees estimated earnings vs DecibelChain potential
- **Traditional PRO vs DecibelChain Comparison Table** — side by side on: payout speed, transparency, split accuracy, black box handling, cost, control
- **Pledge / Commitment CTA** — visitors enter name + email + role and submit a pledge to "Take Ownership" — stored in frontend state (no backend persistence required), shows count of pledges made, thank-you confirmation
- Add `industryHub` page to `Page` type in App.tsx and to Sidebar under new "Campaigns" section
- Add a prominent "Why DecibelChain" banner/CTA card to the Landing Page pointing to industryHub

### Modify
- `App.tsx`: add `industryHub` to Page type, import and render IndustryHub page
- `Sidebar.tsx`: add new "Campaigns" section with industryHub nav item (Megaphone icon)
- Landing page: add campaign section / CTA card pointing to industryHub

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/IndustryHub.tsx` — full campaign/education page
2. Update `src/frontend/src/App.tsx` — add page type and render
3. Update `src/frontend/src/components/Sidebar.tsx` — add Campaigns nav section
4. Update landing page to add CTA card to the campaign hub
