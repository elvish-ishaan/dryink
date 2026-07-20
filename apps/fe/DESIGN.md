# Dryink Frontend — Design Standards

This document is the reference for the design system introduced across the
landing page (`app/page.tsx`), navigation, footer, and pricing redesign.
When building or editing any marketing/public-facing UI in `apps/fe`, match
these standards instead of inventing new patterns.

## Philosophy

- **Light-first, monochrome, single accent.** The site is light-mode by
  default (black text on white/near-white surfaces), not the old
  dark-mode-forced theme. Purple (`#4a3294`) is the **only** brand accent —
  used sparingly for emphasis (highlighted pricing tier, icon badges, hover
  states, links), never as a primary surface color.
- **Structure is black/white/gray. Accent is purple. That's it.** Don't
  introduce new accent colors (the spec's green "Upgrade" chip is the one
  sanctioned exception, scoped to that single credits-upsell chip).
- Dark mode still exists and must keep working (`next-themes`, manual
  toggle in the navbar) — always pair new light styles with a `dark:`
  fallback rather than deleting dark support.

## Typography

Four fonts are loaded in `app/layout.tsx` via `next/font/google`, each with
weights `400/500/600/700` and exposed as CSS variables, then mapped to
Tailwind utilities in `app/globals.css`'s `@theme inline` block:

| Font | CSS var | Tailwind utility | Use for |
|---|---|---|---|
| Fustat | `--font-fustat` | `font-heading` | Large headlines (hero H1, section H2s, pricing `$price`) |
| Schibsted Grotesk | `--font-schibsted-grotesk` | `font-nav` | Nav items, logo wordmark, buttons, labels, card titles, uppercase micro-labels |
| Noto Sans | `--font-noto-sans` | `font-body` | Paragraph/body copy (subtitles, descriptions, feature text) |
| Inter | `--font-inter` | `font-badge` (also `font-sans` default) | Badges/pills, small meta text |

Rules of thumb:
- Headlines: `font-heading font-bold`, tight tracking (`tracking-[-2px]` to
  `tracking-[-4.8px]` depending on size), `leading-none`.
- Buttons and nav labels: `font-nav font-medium`.
- Body paragraphs: `font-body`, color `#505050` (not pure black — see
  palette).
- Compound badges/pills: `font-badge` (Inter), `text-sm`/`text-xs`.

## Color palette

| Token | Value | Usage |
|---|---|---|
| Black | `#000000` / `text-black` | Headlines, primary text, primary buttons |
| Gray body text | `#505050` | Subtitles, descriptions, secondary copy |
| Light surface | `#f8f8f8` | Card/section backgrounds (CTA card, pricing cards, enterprise card) |
| White | `#ffffff` | Page background, input/card fill |
| Dark badge | `#0e1311` | Compound badge dark segment (bg-black-ish pill with white text) |
| Purple accent | `#4a3294` | The one brand accent — highlighted pricing tier, icon badges, hover links, glows |
| Green upgrade chip | `rgba(90,225,76,0.89)` | Hero search-box "Upgrade" chip only |
| Overlay/scrim | `rgba(0,0,0,0.24)` | Frosted dark panels over imagery (hero search box) |

Dark-mode equivalents live alongside every light class as `dark:` variants
(e.g. `bg-white dark:bg-neutral-950`, `text-black dark:text-white`,
`border-neutral-200 dark:border-neutral-800`).

## Layout & spacing

- **Horizontal page padding**: `px-6 md:px-[120px]` — used on the navbar,
  hero, CTA section, footer, and pricing page. Any new full-width section
  should match this rhythm.
- **Section vertical rhythm**: generous (`py-16`–`py-24`) for marketing
  sections.
- **Cards**: `rounded-2xl`/`rounded-3xl`, `border border-neutral-200`
  (`dark:border-neutral-700/800`), background `#f8f8f8` (or `white` for the
  hero's inner input card).
- **Buttons**: `rounded-full`. Primary = `bg-black text-white
  hover:bg-black/80` (dark mode: invert to `bg-white text-black`). Secondary
  = transparent/ghost with a neutral border. Accent = `bg-[#4a3294]`, used
  only where purple emphasis is intentional (e.g. the "Most Popular"
  pricing tier).
- **Compound badge pattern**: a dark pill segment (`bg-[#0e1311] text-white`,
  icon + short label) directly abutting a lighter segment with descriptive
  text, both inside one `rounded-full overflow-hidden` wrapper. See the hero
  badge (`✦ New` + "Discover what's possible") and the pricing header badge.
- **Scrollbar**: hidden globally (`scrollbar-width: none` +
  `::-webkit-scrollbar { display: none }` in `globals.css`'s `@layer base`).
  Scrolling still functions; only the visible bar is suppressed. Keep this
  when touching `globals.css`.

## Icons

Use **`lucide-react`** exclusively — there is no separate SVG icon file in
this codebase. Don't introduce a new icon library or hand-rolled SVGs unless
`lucide-react` genuinely lacks the icon.

## Component reference (copy these patterns, don't reinvent)

- **Navbar** (`components/navs/Navbar.tsx`): edge-to-edge fixed bar,
  `120px`/`16px` padding, Schibsted Grotesk logo + nav items, black
  primary / transparent secondary buttons, theme toggle wired through
  `next-themes`' `useTheme()` (not a manual `localStorage`/`classList`
  toggle — that pattern was removed because it fought the light default).
- **Hero** (`components/herosection/Herosection.tsx`): full-bleed
  background image/video behind a light scrim (`bg-gradient-to-b
  from-white/30 via-white/5 to-white/35`) for text legibility, compound
  badge, Fustat headline, Noto Sans subtitle, frosted dark search box
  (`rgba(0,0,0,0.24)` + `backdrop-blur`) with a white inner input card.
- **CTA** (`components/herosection/CTA.tsx`): contained card
  (`bg-[#f8f8f8]`) with a subtle purple glow behind it, dark compound
  badge, black primary button + outline secondary.
- **Features** (`components/herosection/Features.tsx`): light section,
  purple only on headings/icon-badge circles, `font-heading` for step
  titles, `font-body` for copy.
- **Reviews/Testimonials** (`components/reviews/Reviews.tsx`): light cards
  (`#f8f8f8` + `neutral-200` border), purple section heading, star ratings
  in `yellow-500`.
- **Footer** (`components/footer/Footer.tsx`): Schibsted Grotesk wordmark
  matching the navbar, uppercase Schibsted Grotesk micro-labels for column
  headings, Noto Sans links with plain color-transition hover (no
  underline), social icons hover to purple.
- **Pricing** (`components/pricing/PricingPage.tsx`,
  `PricingCard.tsx`, `EnterpriseModal.tsx`): light page background with a
  soft purple glow, dark compound header badge, pricing cards on
  `#f8f8f8`; the highlighted/"Most Popular" tier is the one place a card
  and button legitimately go full purple — all other tiers stay black.

## What not to do

- Don't add a new accent color — reuse `#4a3294` or the black/white/gray
  system.
- Don't hardcode dark-only styling (e.g. forcing `bg-neutral-950` on a page
  root) — the site defaults to light; dark mode is opt-in via the toggle.
- Don't reintroduce a manual dark-mode toggle — use `useTheme()` from
  `next-themes`.
- Don't add a new font — the four above cover headings, nav/labels, body,
  and badges.
- Don't build custom SVG icons when `lucide-react` already has the icon.
