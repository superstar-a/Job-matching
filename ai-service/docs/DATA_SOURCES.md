# JD Data Sources and Scraping Policy

Last reviewed: 2026-08-10

This document defines which JD sources are allowed for the MVP pipeline and
how each source may be used. The default rule is conservative: scrape only
when the source is explicitly allowed by policy/robots review or when the data
is manually provided for this project.

## Source Matrix

| Source | Priority | Allowed method | robots.txt status | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- |
| Manual JD JSON files | P0 | Create/curate normalized JSON in `ai-service/data/samples` | Not applicable | Not applicable | Safest source for deterministic tests, demos, and early entity extraction. Use fictional companies or user-provided JDs with permission. |
| User-provided JD text/HTML | P0 | Ingest user-provided text or HTML, then normalize locally | Not applicable | Not applicable | User must have the right to provide the JD. Do not log private content. |
| Company career pages with permission | P0 | Static BeautifulSoup scraper only when robots and site terms allow it | Check per domain before adding URL | Default `AI_CRAWL_DELAY_SECONDS >= 1`; use lower concurrency only after approval | Prefer official company career pages over job boards. Record reviewed URL, date, and notes before crawling. |
| ITviec public pages | P1 | Research only unless team confirms permission or approved use case | `https://itviec.com/robots.txt` allows `/` except `/subscriptions/new` | Minimum 2-5 seconds per request if approved | Robots is permissive, but ITviec operating rules state site content is protected and prohibit illegal copying/use. Do not use as MVP bulk source without approval. |
| TopCV public pages | P1 | Research only unless team confirms permission or approved use case | `https://www.topcv.vn/robots.txt` disallows private/CV paths; jobs are not explicitly listed there | Minimum 2-5 seconds per request if approved | TopCV terms define TopCV databases as including job ads. Treat as restricted until permission/API/manual export is available. |
| VietnamWorks public pages | P1 | Research only unless team confirms permission or approved use case | `https://www.vietnamworks.com/robots.txt` returned 403 during review | Minimum 2-5 seconds per request if approved | Because robots could not be fetched, do not crawl automatically until reviewed manually or permission/API is confirmed. |
| LinkedIn | P2 | API, explicit permission, or user-provided data only | `https://www.linkedin.com/robots.txt` warns automated access requires express permission and disallows many job paths | No scraping in MVP | Keep blocked in code. Do not use browser/session scraping. |

## P0 Operating Rules

- Use `manual_sample` records for tests and demos until a source is approved.
- Use fictional company names for generated samples.
- Keep `source_url` unique and traceable, even for sample records.
- Store only normalized JSON in git; avoid committing raw scraped HTML from real sites.
- For company career pages, review and record robots/terms before adding URLs.
- Use `AI_CRAWL_DELAY_SECONDS >= 1` and keep batch concurrency low.
- Stop batch processing for a domain if failures, blocks, or policy uncertainty appear.

## Review Checklist Before Adding a Crawl Source

- Confirm source owner and official domain.
- Check `robots.txt` for the exact path pattern.
- Check terms or policy for automated access, copying, and database creation.
- Decide allowed method: manual import, API, static scrape, or blocked.
- Set crawl delay and maximum batch size.
- Add a small test fixture before crawling live pages.
- Record the review date and reviewer in this file.

## Current Decision

For MVP, Step 2 uses P0 manual/sample JDs and permissioned company career
pages only. Job boards remain P1 research targets until the team confirms
legal/product approval. LinkedIn remains P2 and is blocked by the scraper.
