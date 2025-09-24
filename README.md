# HENRYS

Mobile-first Next.js application for the HENRYS invite-only dating club. This repository contains the marketing site, application flow, and admin tools built with the App Router and TypeScript.

## Getting Started

Install dependencies with your preferred package manager (pnpm recommended):

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Additional scripts:

- `pnpm lint` – static analysis using ESLint
- `pnpm build` – production build via Next.js
- `pnpm start` – run the compiled app

## Environment Variables

Copy `.env.example` to `.env.local` and populate values for database URLs, Auth.js email provider, Stripe, and Resend before running the application locally.

## Assets Policy

To keep pull requests lightweight and Codex-friendly, binary assets are not committed to this repository. Please follow these guidelines when working with imagery, video, fonts, or other rich media:

- **No binaries in PRs.** Files ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.ico`, `.mp4`, `.webm`, `.ttf`, `.otf`, `.woff`, `.woff2`, `.sqlite`, `.db`, or `.wasm` are blocked by git hooks and `.gitignore`. Use SVGs or remote URLs instead.
- **Use remote placeholders.** Point artwork to hosted assets such as `https://placehold.co/1200x630?text=HENRYS`. When you add a new host, extend `images.remotePatterns` in `next.config.ts` so `next/image` can load it.
- **Fonts via CSS.** Rely on system stacks or services like Google Fonts rather than shipping font binaries.
- **Need binaries later?** Add them with Git LFS in a separate workflow (not through Codex PRs) so the main repo stays slim.

The default Open Graph preview now uses `https://placehold.co/1200x630?text=HENRYS`, so you already have a patterned example to follow.
