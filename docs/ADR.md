# Architecture Decision Records

This file records the major design decisions in PokéVerse: what was decided, why, what else could have been done, and what each choice costs.

## How to read these records

These records were written after the code, from the repository and from the requirements and discussion during development. They are not contemporaneous meeting notes. To avoid presenting guesses as history, statements are tagged where it matters:

- **Code:** you can verify it in the repository, and the relevant files are named.
- **Development context:** it comes from a stated requirement or a decision made while building the project.
- **Inferred:** a plausible rationale that the code supports but nothing in the project establishes. Treat it as proposed, not documented.
- **Not evaluated:** an alternative that is listed for comparison but was not tried or investigated in this project.

All ten decisions below have the status **Accepted** and are implemented, unless noted.

| ID | Decision |
| --- | --- |
| [ADR-001](#adr-001-nextjs-with-typescript) | Next.js with TypeScript |
| [ADR-002](#adr-002-meta-muse-spark-for-card-reading-and-journey-planning) | Meta Muse Spark for card reading and journey planning |
| [ADR-003](#adr-003-pokéapi-for-species-verification) | PokéAPI for species verification |
| [ADR-004](#adr-004-a-manually-curated-anime-dataset) | A manually curated anime dataset |
| [ADR-005](#adr-005-spoiler-filtering-before-and-after-the-ai-call) | Spoiler filtering before and after the AI call |
| [ADR-006](#adr-006-validate-ai-chosen-episode-ids-against-local-records) | Validate AI-chosen episode IDs against local records |
| [ADR-007](#adr-007-upstash-redis-for-shared-rate-limiting-and-a-global-daily-budget) | Upstash Redis for shared rate limiting and a global daily budget |
| [ADR-008](#adr-008-no-database-and-no-authentication-in-the-first-version) | No database and no authentication in the first version |
| [ADR-009](#adr-009-estimated-runtimes-and-a-limited-viewing-budget) | Estimated runtimes and a limited viewing budget |
| [ADR-010](#adr-010-deterministic-episode-ordering) | Deterministic episode ordering |

---

## ADR-001: Next.js with TypeScript

**Status:** Accepted

**Context.** PokéVerse needs server-rendered pages that read from PokéAPI, server-side endpoints that call a paid AI API without exposing its key, and interactive client UI for uploading photos and building journeys. It also needed to be deployable quickly for a hackathon.

**Decision.** Build a single Next.js 16 application (App Router) in TypeScript, with React 19 and Tailwind CSS 4. Pages are Server Components by default, AI work lives in Route Handlers, and interactive pieces are Client Components. **Code:** `package.json`, `next.config.ts`, `app/`.

**Reasons.**
- One codebase and one deployment for UI, server logic and API routes. *(Inferred)*
- Secrets can stay on the server because only server code reads `MODEL_API_KEY`. *(Code)*
- Shared TypeScript types describe the dataset, the scan result and the journey plan, so the server and the UI agree on shapes. *(Code: `lib/anime/types.ts`, `lib/ai/contracts.ts`)*
- Next.js integrates with the Vercel hosting used for the deployment. *(Inferred)*
- The project was created from the Next.js starter. *(Code: first commit)*

**Alternatives considered.** A separate single-page app with a standalone backend, or a non-TypeScript stack. *(Not evaluated)*

**Trade-offs and consequences.**
- Next.js 16 with Cache Components behaves differently from older versions. For example, route-segment settings like `export const dynamic` are rejected, and request-time data (`params`, `searchParams`) must sit behind `<Suspense>`. The repository's `AGENTS.md` warns about these differences. *(Code)*
- Serverless instances share no memory, which later forced the shared rate-limit store ([ADR-007](#adr-007-upstash-redis-for-shared-rate-limiting-and-a-global-daily-budget)).
- There is no import guard that stops a Client Component from importing server modules; this relies on review.

---

## ADR-002: Meta Muse Spark for card reading and journey planning

**Status:** Accepted

**Context.** The project is an entry for the Meta Global AI Developer Hackathon. It needs a model that can read a photo of a card and also write and select from structured text. *(Development context)*

**Decision.** Use Meta's `muse-spark-1.3` model for both tasks. Call it from one module, `lib/ai/meta-client.ts`, using the `openai` SDK pointed at `https://api.meta.ai/v1` with the Responses API, `reasoning.effort` set to `low`, and no automatic retries. Images are sent as base64 data URLs. **Code:** `lib/ai/meta-client.ts`.

**Reasons.**
- Using Meta's model was the intent of the hackathon entry. *(Development context)*
- Meta's documentation for this model lists image input and describes an OpenAI-compatible API, so an existing SDK could be reused and only one new dependency (`openai`) was needed. *(Development context: documentation reviewed while building)*
- One model and one client for both features keeps the AI surface small. *(Inferred)*
- The Responses API is the surface Meta's guidance favours for reasoning models. *(Development context)*

**Alternatives considered.** Other vision-language models, or a pipeline of OCR plus a separate classifier. *(Not evaluated)* Within Meta's API, Chat Completions was available but not chosen. *(Development context)*

**Decisions inside this decision.**
- *JSON in the prompt, validated by our code, instead of schema-enforced output.* The Meta documentation reviewed did not show the Responses API shape for `text.format`, so the app parses and validates the JSON itself. *(Development context)* A side effect is that every model answer is treated as untrusted input.
- *`maxRetries: 0`.* One application request should equal one billed Meta request so that the daily budget is exact ([ADR-007](#adr-007-upstash-redis-for-shared-rate-limiting-and-a-global-daily-budget)). *(Development context, Code)*
- *Low reasoning effort* to keep calls fast. *(Inferred from the setting and observed latency)*

**Trade-offs and consequences.**
- The product depends on one provider, one pinned model ID and its pricing, which this repository does not verify.
- Output is not deterministic. Two identical journey requests can give different titles and reasons, which is why the server, not the model, owns facts and order.
- A transient Meta error returns an error to the user instead of retrying. They can retry, and that costs another budget unit.

---

## ADR-003: PokéAPI for species verification

**Status:** Accepted

**Context.** A language model can name the wrong Pokémon or an invented one. The app needs a reliable way to decide whether a name is a real species, and a stable key to join with the anime dataset. *(Development context)*

**Decision.** Use PokéAPI as the source of truth for species, types, artwork, stats and evolutions. A name from the model becomes a confirmed Pokémon only if PokéAPI knows it, and the National Dex species ID (`speciesId`) links the dataset. **Code:** `lib/pokeapi/`, `lib/ai/card-scanner.ts`, `lib/anime/queries.ts`.

**Reasons.**
- It is a free public API with stable numeric species IDs. *(Inferred)*
- Using IDs rather than display names avoids mismatches such as "Mr. Mime" versus "mr-mime". The code converts names with `toPokeApiSlug` and falls back to the species' default form when a name has none. *(Code)*
- The project's requirements were to verify the species and clearly distinguish verified from unverified details. *(Development context)*

**Alternatives considered.** Bundling our own species table, or using a trading-card database for card-level data. *(Not evaluated)*

**Trade-offs and consequences.**
- PokéAPI covers species, not individual cards or the anime. Card name, number and set read by the model therefore stay unverified and are labelled so.
- The app depends on a third-party service. Calls time out after 8 seconds and are cached for days with `use cache`, so brief outages mostly affect uncached pages. A failure during a scan produces `verification: "unavailable"` rather than a guessed Pokémon. *(Code)*
- Artwork is hotlinked from PokéAPI's sprites repository, not stored. *(Code: `next.config.ts`)*

---

## ADR-004: A manually curated anime dataset

**Status:** Accepted

**Context.** PokéAPI has no anime data. Asking a model to recall which episodes feature a Pokémon invites invented titles, numbers and events. The requirement was explicit: do not invent episodes, characters or sources. *(Code: comment in `lib/anime/types.ts`; Development context)*

**Decision.** Keep the anime data in `data/anime/episodes.ts` as typed, hand-checked records. Each record has a stable ID, title, series, overall episode number, original summary, featured characters, per-Pokémon role and significance, a spoiler level, a source URL and a `verifiedOn` date. Unknown values are `null` (all air dates are `null`).

**Reasons.**
- It makes "verified" a property of the data rather than a promise about a model. *(Development context)*
- Every episode links to a page where a person can check it. *(Code)*
- Summaries are written in our own words with a link, rather than copying source text. *(Development context)*

**Source choice.** The records were checked against Serebii.net's episode guides and Animédex. Bulbapedia was the first-choice source, but it returned a bot-protection challenge to automated requests, and the project did not try to bypass it. *(Development context)*

**Alternatives considered.**
- Letting the model recall episodes. Rejected because of hallucination risk. *(Development context)*
- Scraping a wiki at build or run time. Rejected because the preferred wiki blocked automated access and copying content has licensing implications. *(Development context)*
- Storing the data in a database. *(Not evaluated; see [ADR-008](#adr-008-no-database-and-no-authentication-in-the-first-version))*

**Trade-offs and consequences.**
- The dataset is tiny: 11 episodes covering 12 species. Journeys for many selections are short, and the planner says so.
- Growing it is manual work and a code change plus deploy.
- Episode numbers are Serebii's overall numbering. Other sites number some episodes differently, so the UI labels them as such.
- The data is part of the client bundle (see [ADR-005](#adr-005-spoiler-filtering-before-and-after-the-ai-call) for the spoiler implication).

---

## ADR-005: Spoiler filtering before and after the AI call

**Status:** Accepted

**Context.** Fans want to explore stories without learning how they end. A model can also reveal outcomes from its own background knowledge, even if the prompt never mentions them. *(Development context)*

**Decision.** Use layers:
1. **Data model:** every record separates premise text (always safe) from an optional `outcome` with a level (`mild` or `major`). *(Code: `lib/anime/types.ts`)*
2. **Before the call:** outcomes above the viewer's setting are not put in the prompt. *(Code: `buildPrompt`)*
3. **In the response:** hidden outcomes are returned with empty text. *(Code: `redactOutcome` in `lib/ai/journey.ts`)*
4. **After the call:** model-written text is checked, and replaced with the dataset's premise text when it fails. *(Code: `vetProse`)*
5. **Rendering:** every episode card requires the viewer's setting and shows a lock badge for hidden outcomes. *(Code: `AnimeEpisodeCard`)*

The default setting is "No spoilers". *(Development context: changed from "Mild" after a review)*

**Reasons.**
- A model cannot repeat what it was never given, so the pre-filter is the strongest control and is deterministic. *(Inferred)*
- A post-check is still needed because the model may use outside knowledge, and a prompt instruction alone is not reliable. *(Inferred)*
- Falling back to dataset text keeps the product honest when a check fails. *(Development context)*

**History worth knowing.** The first version used one spoiler tag per episode over text that mixed premise and outcome. A review found the "Start here" section ignored the setting and that "Mild" showed major outcomes. The record was restructured into premise and outcome fields. *(Development context)*

**Alternatives considered.**
- Only a prompt instruction ("do not spoil"). *(Not evaluated beyond reasoning that it is unreliable)*
- Only a post-filter. It would let hidden text reach the model.
- A second model call as a judge of spoiler safety. It would add cost and spend budget units. *(Not evaluated)*
- No AI-written prose at all, only dataset text. *(Not evaluated)*

**Trade-offs and consequences.**
- The prose checks are word and pattern based. They can reject harmless text (observed in testing, and the fallback is safe), and they cannot be proven to catch every paraphrase.
- Hiding on the story page and scanner is an interface feature. The dataset ships in client code, so a determined visitor can read hidden outcomes. Only `/api/journey` redacts server-side.
- Which outcomes count as "mild" or "major" is an editorial judgement made by the author.

---

## ADR-006: Validate AI-chosen episode IDs against local records

**Status:** Accepted

**Context.** The planner asks a model to choose episodes. Models can return IDs that do not exist, repeat an episode, or return more than was asked. *(Development context)*

**Decision.** Give the model a closed list of candidate episodes, require it to answer with episode IDs copied from that list, and validate every ID on the server. Unknown IDs and duplicates are dropped and counted, excess episodes beyond the budget are cut, and if nothing valid remains the request fails with an error rather than inventing a journey. All displayed facts are read from the local record for each valid ID. **Code:** `assemblePlan` in `lib/ai/journey.ts`.

**Reasons.**
- It makes "only verified episodes appear" a guarantee about the output rather than a hope about the model. *(Development context)*
- Reading titles, numbers and sources from the dataset means the model cannot change them. *(Code)*

**Alternatives considered.** Trusting the model's JSON, matching titles by fuzzy text, or retrying the model when its answer is invalid. *(Not evaluated)*

**Trade-offs and consequences.**
- Bad picks are removed, not repaired, so the journey can end up shorter. A notice tells the user how many suggestions were removed.
- There is no retry on an unusable answer, which would cost another budget unit. The user sees an error and can try again.
- Validation proves an episode is real and relevant to a selected Pokémon. It does not prove the model's explanation of it is accurate, which is why that text is also checked ([ADR-005](#adr-005-spoiler-filtering-before-and-after-the-ai-call)).

---

## ADR-007: Upstash Redis for shared rate limiting and a global daily budget

**Status:** Accepted. Revised once; see history.

**Context.** Both AI features cost money. Vercel runs the app on many short-lived instances that share no memory, so an in-memory counter would give each instance its own limit. The owner wanted a total daily cap across all visitors and both features. *(Development context)*

**Decision.** Store counters in Upstash Redis through its REST API using `fetch`, with no SDK. Use two kinds of counter: a per-visitor window (10 requests per 10 minutes, per route) and a single app-wide daily counter (`AI_DAILY_CALL_LIMIT`, resets at 00:00 UTC). Each update is one `MULTI/EXEC` transaction. In production, if Redis is not configured or does not answer correctly, reject the request with 503 instead of allowing unmetered use. The daily unit is consumed only after validation, immediately before the Meta call. **Code:** `lib/rate-limit.ts`, `app/api/scan/route.ts`, `app/api/journey/route.ts`.

**Reasons.**
- Counters in Redis are shared by every instance, and `INCR` inside a transaction gives each concurrent request a distinct count. *(Inferred from Redis semantics; the tests used a fake store, see below)*
- A REST API works from serverless functions without long-lived connections, and avoids an extra dependency. *(Inferred)*
- Vercel's Upstash integration sets `KV_REST_API_*` variables, and the code accepts both naming schemes. *(Code)*
- Failing closed bounds worst-case spending, which was the goal. *(Development context)*

**History.** The first version fell back to in-memory counting whenever Redis was missing, and counted every request before validation. It was changed to fail closed in production and to count only validated, about-to-be-billed requests. `maxRetries` was also set to 0 so one unit equals one Meta request. *(Development context; see the `Secure global AI usage limits` commit)*

**Alternatives considered.** An in-memory limiter (rejected: per-instance). A database table as the counter, Vercel's own limiter, or Upstash's rate-limit SDK. *(Not evaluated)*

**Trade-offs and consequences.**
- If Redis is down, misconfigured, or out of quota, the AI features are unavailable. This is intentional. Spend stays bounded, availability does not.
- Fixed windows can allow a burst across a window boundary.
- A unit is not refunded when the Meta call fails, because a failed call may still be billed.
- The budget counts requests, not tokens. A scan and a journey each cost one unit even though they cost different amounts.
- The per-visitor layer depends on the client IP header, which the Vercel platform sets. Elsewhere it could be spoofed. The daily budget does not depend on it.
- All rate-limit tests used a local fake that implements the Upstash commands the code sends. The code has not been tested against a real Upstash database in this repository's history.

---

## ADR-008: No database and no authentication in the first version

**Status:** Accepted

**Context.** The hackathon has a fixed deadline, and the core question is whether card-to-story AI works, not whether the app stores user data. The requirements for the AI phases said not to add a database or authentication. *(Development context)*

**Decision.** Keep the app stateless. Anime data lives in code, Pokémon data comes from PokéAPI, rate-limit counters live in Redis, and no user accounts or saved user data exist. Uploaded images are not stored.

**Reasons.**
- It removes whole areas of work and risk (user data, privacy, sessions, migrations). *(Inferred)*
- It makes the privacy story simple: photos are processed in memory and sent to Meta for the scan. *(Code)*
- A curated dataset of this size fits comfortably in a source file. *(Code)*

**Alternatives considered.** Supabase, or another hosted database and auth provider, for saved collections and journeys. They were deliberately left out of scope. *(Development context)*

**Trade-offs and consequences.**
- The collection is device-only (`localStorage`): it does not sync across devices and is lost if the user clears site data. Nothing else persists between visits.
- There is no per-user limit, so one visitor can use the shared daily budget ([ADR-007](#adr-007-upstash-redis-for-shared-rate-limiting-and-a-global-daily-budget)).
- Updating episode data means editing code and redeploying.
- Users who want to keep a journey have to copy it themselves.

---

## ADR-009: Estimated runtimes and a limited viewing budget

**Status:** Accepted

**Context.** Users want a plan that fits the time they have. The dataset does not store verified runtimes, and inventing exact runtimes would break the project's rule against unverified facts. *(Development context)*

**Decision.** Offer three budgets (30 minutes, 1 hour, 2 hours) and plan with a fixed estimate of 25 minutes per episode (`MINUTES_PER_EPISODE`). That allows at most 1, 2 or 4 episodes. The UI labels every duration as an estimate. If the dataset has too few suitable episodes, the journey is shorter and says why. **Code:** `lib/ai/journey.ts`, `lib/ai/contracts.ts`, `components/JourneyBuilder.tsx`.

**Reasons.**
- It is honest: the number is a labelled planning assumption, not a claimed fact. *(Development context)*
- A small, fixed set of budgets keeps the AI task bounded, which also bounds output tokens and cost. *(Inferred)*
- The 25-minute figure is a rough planning value. The code does not establish where it came from, so it should be treated as an assumption. *(Inferred)*

**Alternatives considered.** Storing a verified runtime per episode, free-form time entry, or budgeting by number of episodes instead of time. *(Not evaluated)*

**Trade-offs and consequences.**
- The estimate is coarse. A 30-minute budget yields one episode, and real runtimes can differ.
- Fewer than the maximum episodes often appear because the dataset is small.
- If verified runtimes are added to the data, the constant can be replaced by real values without changing the rest of the flow.

---

## ADR-010: Deterministic episode ordering

**Status:** Accepted

**Context.** A journey should feel like a continuous story, and the model should not be able to reorder events in a way that contradicts the real order of episodes. *(Development context)*

**Decision.** After validating the model's picks, the server sorts the chosen episodes by Serebii's overall episode number (ascending) and builds the transitions between chapters itself. The model decides which episodes are included and writes the reasons. Transitions use only dataset facts: shared selected Pokémon, shared characters, series changes, and the difference between episode numbers. **Code:** `assemblePlan` and `buildTransition` in `lib/ai/journey.ts`.

**Reasons.**
- Order is a verifiable property, so it should not depend on a model. *(Development context)*
- Transitions written by the model could claim relationships between episodes that the data does not support. Building them locally keeps them grounded, and since the order is final only after sorting, they are generated after it. *(Development context)*
- The wording varies by position so long journeys do not repeat themselves. *(Code)*

**Alternatives considered.** Letting the model order the episodes, or having the model write each transition. The latter would feel more natural but cannot be checked against the data. *(Not evaluated beyond this reasoning)*

**Trade-offs and consequences.**
- Ordering assumes that Serebii's overall numbering follows broadcast order. That assumption is not independently verified in this repository. *(Inferred)*
- Order does not reflect story dependencies, because the dataset does not store them. "Continuity" means broadcast order plus shared Pokémon and characters, not proven plot connections.
- When the model returns more episodes than the budget allows, the server keeps the first ones in the model's listing order before sorting. The model's listing order is therefore a priority signal, and a model that lists in watch order could cause later, better episodes to be dropped.
- Transitions read as plain bridges built from facts, not as narrative prose.
