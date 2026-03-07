# Agent Skills Practice Validation For DrawAndGuess

## What Was Tested

This repository was used to validate three practical ideas from the article:

1. Skills are useful when they package procedural knowledge, not just static notes.
2. A project-level marketing context file improves relevance and consistency.
3. Marketing / SEO work is more useful when it changes visible page structure, not only meta tags.

## Applied In This Project

### 1. Added project marketing context

File: `.agents/product-marketing-context.md`

Purpose:
- define audience
- define positioning
- define SEO / growth goals
- define messaging constraints

Why this is useful:
- it prevents generic copy
- it stops the agent from inventing unsupported claims
- it gives a stable reference for future landing-page or SEO tasks

### 2. Added a repo-local reusable skill

File: `.agents/skills/drawguess-home-seo-refresh/SKILL.md`

Purpose:
- turn homepage SEO refresh into a repeatable workflow
- force alignment between visible copy, schema, internal links, and locale content
- preserve the create/join funnel instead of letting marketing copy overwhelm the page

Why this is useful:
- the workflow is now auditable and reusable
- future edits can follow the same checklist instead of re-deciding the process
- this matches the article's claim that a skill should encode "how to do it"

### 3. Applied the workflow to the homepage

Files:
- `client/src/pages/Home.jsx`
- `client/src/home.module.scss`
- `client/src/locales/en.json`
- `client/src/locales/zh.json`

Changes:
- added above-the-fold explanatory copy near the join flow
- added visible "why play", "how it works", and FAQ sections
- added internal links to About / Privacy / Contact
- aligned visible FAQ content with existing FAQ structured data
- kept the page bilingual and mobile-friendly

Why this is useful:
- the homepage now contains crawlable product information instead of mostly a form
- internal linking and trust pages are easier for users and crawlers to discover
- the page still prioritizes conversion into gameplay

## Practical Verdict

The article's approach is useful in this repo, but only when used concretely.

What proved useful:
- skill metadata and frontmatter for discoverability
- project context for better output quality
- procedural checklists for repeatable landing-page / SEO work

What did not get proven here:
- actual ranking uplift
- traffic growth
- conversion lift from search visitors

Those require production deployment plus Search Console / analytics data over time.
