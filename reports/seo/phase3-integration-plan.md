# Phase 3A Integration Plan

- Status: **READY_FOR_SEPARATE_APPROVAL**
- Website integration: **BLOCKED**
- Required approval: `APPROVED — ALLOW SEO INTEGRATION INTO WEBSITE`
- New runtime libraries: **none**

| Order | File | Location | Change | Risk |
|---:|---|---|---|---|
| 1 | `index.html` | head metadata block | Add verified canonical, Open Graph, and Twitter metadata. | medium |
| 2 | `index.html` | head after metadata | Add validated Restaurant/WebSite/WebPage JSON-LD from verified fields. | high |
| 3 | `index.html` | hero and trust surfaces | Apply approved locality/category wording and resolve placeholder email and unverified rating. | high |
| 4 | `robots.txt` | new production file | Publish approved search, AI search/citation, training, unknown-crawler, and sitemap directives. | high |
| 5 | `sitemap.xml` | new production file | Publish only canonical indexable URLs without priority/changefreq tags. | medium |
| 6 | `index.html` | content and image elements | Integrate approved visible answer passages and responsive image attributes. | medium |
| 7 | `app.js` | loader and map initialization | Consider deferred map initialization and shorter loader gating in a separate performance implementation. | high |

## Unresolved Production Decisions

- Verified HTTPS production origin
- Approved absolute social image URL
- Verified public email or removal decision
- Displayed 4.8 rating evidence or removal decision
- Big Tokyo availability and order state
- English, Greek, or bilingual URL/content strategy
- AI model-training crawler policy
- Unknown-crawler default policy
- Authorized GSC, GA4, GBP, Bing, Maps, backlink, or rank-data adapters

## Rollback

Restore only approved protected files from .approved-baseline/ or the pre-integration SHA-256 manifest; remove newly approved crawler files if they did not exist before integration.
