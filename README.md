# StenoProof

AI-powered transcript proofreading for court reporters and stenographers.

## Features

- **Upload & Proofread** - Drop a .txt transcript file and get a detailed error report
- **Smart Error Detection** - Catches typos, grammar issues, missing words, untranslated steno codes
- **Page:Line References** - Every error includes exact location for quick fixes
- **Privacy-First** - Files are processed in memory only, never stored
- **HTML Reports** - Download professional reports ready for printing

## Quick Start

### 1. Install dependencies

```bash
cd stenoproof
npm install
```

### 2. Add your Anthropic API key

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get an API key at: https://console.anthropic.com/

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Upload a transcript

- Export your transcript as .txt from CaseCatalyst, Eclipse, or any CAT software
- Drag & drop or browse to upload
- Wait for processing (larger files take longer)
- Download your HTML error report

## Supported CAT Software

Works with standard ASCII transcript exports from:
- CaseCatalyst
- Eclipse
- ProCAT Winner
- StenoCAT
- digitalCAT
- Any software that exports standard court transcript format

## Transcript Format

StenoProof expects standard court transcript format:

```
                                                              1

        1        Q.  Can you state your name for the record?

        2        A.  John Smith.

        3        Q.  And where do you live?
```

- Page numbers on their own line
- Line numbers 1-25
- Standard Q/A format

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API

## Project Structure

```
stenoproof/
├── src/
│   ├── app/
│   │   ├── api/proofread/    # Proofreading API endpoint
│   │   ├── page.tsx          # Main upload UI
│   │   └── layout.tsx        # App layout
│   ├── lib/
│   │   ├── parser.ts         # Transcript parsing logic
│   │   ├── proofreader.ts    # Claude API integration
│   │   └── report-generator.ts
│   └── types/
│       └── index.ts          # TypeScript types
├── PLAN.md                   # Development roadmap
└── README.md
```

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Add your `ANTHROPIC_API_KEY` in Vercel's environment variables.

## Cost Estimate

~$1.50-2.00 per 250-page transcript using Claude Sonnet.

## License

MIT
