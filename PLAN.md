# StenoProof - AI-Powered Transcript Proofreading Tool

## Overview
A web-based tool for professional court reporters and stenographers to upload transcript files and receive detailed proofreading reports with page:line error locations. Built with privacy-first architecture and dual-agent verification for maximum accuracy.

---

## Target Users
Professional stenographers using:
- **CaseCatalyst** (Stenograph) - Industry standard
- **Eclipse** - Major competitor
- **ProCAT Winner** - Feature-rich option
- **StenoCAT** - Budget-friendly option
- **digitalCAT** - Popular alternative

All export to similar .txt formats with standardized court document formatting (25 lines per page, line numbers, page headers).

---

## Core Features

### MVP (Phase 1)
1. **File Upload** - Drag/drop or browse for .txt transcript files
2. **Dual-Agent Proofreading** - Two separate AI passes for accuracy
3. **Error Report Generation** - HTML/PDF with page:line numbers
4. **Zero Data Retention** - Files processed in memory, never stored
5. **End-to-End Encryption** - TLS in transit, encrypted processing

### Phase 2
6. **User Accounts** - Secure authentication (no transcript storage)
7. **Error Analytics** - Track common error patterns over time
8. **Progress Reports** - Show improvement trends, frequent mistakes
9. **Custom Dictionaries** - Legal terms, names, jurisdiction-specific

### Phase 3
10. **Batch Processing** - Multiple transcripts at once
11. **Integration APIs** - Direct export from CAT software
12. **Team Features** - Agency/firm accounts with multiple reporters

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Upload    │  │   Report    │  │  Analytics  │             │
│  │   (.txt)    │  │   Viewer    │  │  Dashboard  │             │
│  └──────┬──────┘  └──────▲──────┘  └──────▲──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │ TLS            │                │
┌─────────▼────────────────┴────────────────┴─────────────────────┐
│                         BACKEND                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Gateway                               ││
│  │              (Rate limiting, Auth)                           ││
│  └─────────────────────────┬───────────────────────────────────┘│
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────────┐│
│  │               Processing Pipeline                            ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    ││
│  │  │  Parse   │─▶│  Agent 1 │─▶│  Agent 2 │─▶│  Report  │    ││
│  │  │  & Chunk │  │ Proofread│  │  Verify  │  │   Gen    │    ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────────┐│
│  │           Analytics Store (Metadata Only)                    ││
│  │     - Error types/counts (no transcript content)            ││
│  │     - User progress metrics                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │     Claude API          │
              │  (Anthropic)            │
              └─────────────────────────┘
```

---

## Dual-Agent Verification System

### Agent 1: Primary Proofreader
- Reads transcript in chunks (respecting page boundaries)
- Identifies errors: typos, grammar, missing words, untranslated steno
- Returns structured JSON with error locations

### Agent 2: Verification Agent
- Receives Agent 1's error list + original transcript
- Confirms each error (eliminates false positives)
- Checks for missed errors (reduces false negatives)
- Returns final verified error list

### Why Two Agents?
- Legal transcripts demand near-perfect accuracy
- Single LLM pass can hallucinate errors or miss real ones
- Second pass catches ~15-20% of false positives in testing
- Gives users confidence in the tool

---

## Privacy & Security Architecture

### Data Flow
1. User uploads file → encrypted in transit (TLS 1.3)
2. File held in memory only → never written to disk
3. Processed through Claude API → Anthropic's privacy policy applies
4. Report generated → returned to user
5. Memory cleared → no trace remains

### What We Store (Metadata Only)
- User account info (email, hashed password)
- Error statistics (counts by type, no content)
- Usage metrics (transcripts processed, not content)

### What We NEVER Store
- Transcript content
- Error text/corrections
- Any identifying case information
- IP addresses beyond session

### Compliance Considerations
- HIPAA-adjacent (medical depositions)
- Attorney-client privilege concerns
- Court confidentiality requirements
- SOC 2 Type II certification goal (Phase 2)

---

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React-PDF** - PDF report generation client-side

### Backend
- **Next.js API Routes** - Serverless functions
- **Anthropic Claude API** - AI proofreading
- **Vercel** - Hosting (serverless, auto-scaling)

### Database (Metadata Only)
- **Supabase** or **PlanetScale** - User accounts, analytics
- Row-level security for user data isolation

### Auth
- **Clerk** or **NextAuth.js** - Secure authentication
- Optional: SSO for law firms

---

## Transcript Parsing Logic

Standard court transcript format:
```
                                                              1

        1        Q.  Can you state your name for the record?

        2        A.  John Smith.

        3        Q.  And where do you live?
        ...
       25        A.  Yes, I do.



                                                              2

        1        Q.  How long have you lived there?
```

### Parsing Rules
1. Page number: Right-aligned number on its own line
2. Line numbers: Left-aligned 1-25
3. Content: After line number, may include speaker (Q./A./MR./etc.)
4. Handle: Headers, footers, exhibit markers, timestamps

### Chunking Strategy
- Process by page boundaries (not arbitrary character limits)
- Include 2-page context window for continuity
- Preserve exact line numbers for error reporting

---

## API Cost Estimation

### Per Transcript (250 pages)
- ~75,000 tokens input (transcript text)
- ~5,000 tokens output (error reports)
- Agent 1 + Agent 2 = 2 passes
- **Estimated cost**: $1.50 - $3.00 per transcript (Claude Sonnet)

### Pricing Models to Consider
1. **Subscription**: $49/month unlimited (up to X pages)
2. **Per-page**: $0.02/page processed
3. **Token pass-through**: Cost + 30% markup
4. **Tiered**: Free tier (50 pages/month) → Pro → Enterprise

---

## User Interface Wireframes

### Upload Screen
```
┌────────────────────────────────────────────────────────┐
│  StenoProof                              [Account] [?] │
├────────────────────────────────────────────────────────┤
│                                                        │
│         ┌──────────────────────────────────┐          │
│         │                                  │          │
│         │     📄 Drop transcript here      │          │
│         │        or click to browse        │          │
│         │                                  │          │
│         │       Supports .txt files        │          │
│         └──────────────────────────────────┘          │
│                                                        │
│         [x] I confirm this transcript contains        │
│             no privileged information I cannot        │
│             process through a third-party service     │
│                                                        │
│                    [ Start Proofreading ]             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Processing Screen
```
┌────────────────────────────────────────────────────────┐
│  StenoProof                              [Account] [?] │
├────────────────────────────────────────────────────────┤
│                                                        │
│              Proofreading in progress...              │
│                                                        │
│         ████████████████░░░░░░░░░░  67%              │
│                                                        │
│         ✓ Parsing transcript                          │
│         ✓ First pass proofreading (Agent 1)          │
│         ◐ Verification pass (Agent 2)                 │
│         ○ Generating report                           │
│                                                        │
│         Processing page 168 of 250...                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Report Screen
```
┌────────────────────────────────────────────────────────┐
│  StenoProof                              [Account] [?] │
├────────────────────────────────────────────────────────┤
│  ◀ Back                    [ Download HTML ] [ PDF ]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Proofreading Report: davi_deposition_vol2.txt       │
│  ─────────────────────────────────────────────────    │
│  Pages: 254  |  Errors Found: 42  |  Time: 2m 34s    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Page:Line │ Error           │ Correction    │Type│ │
│  ├───────────┼─────────────────┼───────────────┼────┤ │
│  │ 2:20      │ "those question"│ "questions"   │Gram│ │
│  │ 37:24     │ "believes so"   │ "believe so"  │Typo│ │
│  │ 52:20     │ "ever needs"    │ "ever need"   │Gram│ │
│  │ ...       │ ...             │ ...           │ ...│ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Analytics Dashboard (Phase 2)
```
┌────────────────────────────────────────────────────────┐
│  StenoProof                              [Account] [?] │
├────────────────────────────────────────────────────────┤
│  Your Progress                                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Transcripts Proofread: 47    Total Pages: 8,234     │
│                                                        │
│  Error Rate Over Time                                  │
│  ┌────────────────────────────────────────────┐       │
│  │    ╭─╮                                     │       │
│  │   ╭╯ ╰╮    ╭──╮                           │       │
│  │  ╭╯   ╰────╯  ╰──────────────╮            │       │
│  │──╯                           ╰────────────│       │
│  │ Jan   Feb   Mar   Apr   May   Jun         │       │
│  └────────────────────────────────────────────┘       │
│  ↓ 34% fewer errors per page vs. first month         │
│                                                        │
│  Most Common Errors:                                   │
│  1. Missing 's' in plurals (23%)                      │
│  2. your/you confusion (18%)                          │
│  3. Missing 'be' verb (12%)                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Development Phases

### Phase 1: MVP (2-3 weeks)
- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] File upload component
- [ ] Transcript parser
- [ ] Claude API integration
- [ ] Dual-agent proofreading pipeline
- [ ] HTML report generation
- [ ] Basic UI (upload → processing → report)
- [ ] Deploy to Vercel

### Phase 2: Users & Analytics (2-3 weeks)
- [ ] User authentication (Clerk)
- [ ] Database setup (Supabase)
- [ ] Error analytics tracking
- [ ] Progress dashboard
- [ ] Payment integration (Stripe)
- [ ] Subscription management

### Phase 3: Polish & Scale (2-3 weeks)
- [ ] PDF report generation
- [ ] Batch uploads
- [ ] Custom dictionaries
- [ ] Team/agency accounts
- [ ] API documentation
- [ ] SOC 2 compliance prep

---

## File Structure

```
stenoproof/
├── app/
│   ├── page.tsx                 # Landing/upload page
│   ├── layout.tsx               # Root layout
│   ├── processing/
│   │   └── page.tsx             # Processing status
│   ├── report/
│   │   └── [id]/page.tsx        # Report viewer
│   ├── dashboard/
│   │   └── page.tsx             # Analytics (Phase 2)
│   └── api/
│       ├── proofread/
│       │   └── route.ts         # Main proofreading endpoint
│       ├── parse/
│       │   └── route.ts         # Transcript parsing
│       └── report/
│           └── route.ts         # Report generation
├── components/
│   ├── ui/                      # shadcn components
│   ├── FileUpload.tsx
│   ├── ProcessingStatus.tsx
│   ├── ErrorTable.tsx
│   └── ReportViewer.tsx
├── lib/
│   ├── parser.ts                # Transcript parsing logic
│   ├── proofreader.ts           # Claude API integration
│   ├── verifier.ts              # Agent 2 verification
│   ├── report-generator.ts      # HTML/PDF generation
│   └── encryption.ts            # Client-side encryption utils
├── types/
│   └── index.ts                 # TypeScript types
├── PLAN.md                      # This file
└── README.md
```

---

## Next Steps

1. **Initialize project**: `npx create-next-app@latest stenoproof`
2. **Set up core parsing logic**: Handle transcript format
3. **Build proofreading pipeline**: Agent 1 + Agent 2
4. **Create upload UI**: Simple, clean interface
5. **Generate reports**: HTML matching current format
6. **Deploy MVP**: Get it in front of test users

---

## Open Questions

1. **Pricing**: Subscription vs. per-page vs. tokens? Need market research.
2. **Offline mode**: Some reporters work without internet - desktop app later?
3. **CAT integration**: API partnerships with Stenograph/Eclipse?
4. **Certification**: NCRA or court approval needed?
5. **Name**: "StenoProof" - is it available? Alternatives?
