# Kedai Buku — design record

A mobile 8-bit bookshop simulator set in a Petaling Jaya shoplot, in which every book
is a real book and the player can order a physical copy.

This document records the decisions taken during the design session and the reasoning
behind them, so the prototype can be argued with rather than just played.

---

## 1. Decisions taken

| Question | Decision |
|---|---|
| Primary purpose | **A real game that also sells books.** It must stand up as a management sim on its own merits; a heavy-handed shop layer would poison it. |
| Deliverable | Playable single-file web prototype (`index.html`). |
| Book data | Open Library / Google Books. Buy path designed but not wired to a live store. |
| Time model | Discrete trading day: Morning → Open → Closed. One day ≈ 60 seconds of play. |
| Dialogue | Authored dialogue trees. Predictable, offline, no per-conversation cost. |
| Store view | Top-down tile grid with placeable furniture. Expansion = more tiles. |
| Core skill | **Matching people to books, plus curation** — what you choose to stock. Pricing is a real system but not the skill being tested. |
| Stakes | Soft pressure. Rent and stock costs bite, but the shop cannot be lost. |
| Setting | Malaysian shoplot bookstore, RM currency. The player names the shop; it is painted on the sign above the shelves. |

The purpose decision is load-bearing. Because the sim comes first, the commerce layer is
placed where a bookshop would place it — on the book itself, reached by curiosity — and
never as an interruption. A player who has just lost a sale is not shown a buy button.

---

## 2. Core loop

**MORNING.** The distributor van arrives with eight titles at trade cost. Shelf space is
finite (three titles per shelf). What you buy is what this neighbourhood gets to read for
the next few days — this is the curation half of the game, and it is a commitment made
before you know who is coming in.

Pricing is per title: **AUTO** sets 1.75× cost, safe and never greedy; **MANUAL** lets you
chase margin. Manual is not free money — every customer carries a private ceiling, and
Wei Lun's is RM30 whatever you think the book is worth.

**OPEN.** The day runs compressed. Customers arrive, walk to a shelf, and browse. Each
carries a **patience bar**; when it empties they leave. More customers arrive than you can
personally serve, so the moment-to-moment decision is *who do I approach* — and that is the
whole game in one gesture.

Tapping a customer opens a conversation. You have **three questions**, each of which costs
patience and returns a **clue chip** — a genre, a mood, a budget, a refusal. Then you pick a
title off your own shelves and read its page — synopsis, themes, price, reviews, with the
customer's clue chips repeated underneath — before confirming or going back for another.
Staking a recommendation is a decision, so the information belongs at the decision point.

The recommendation is scored against a hidden want vector:

```
genre match           +42     genre they refuse      −55
each mood match       +16     mood they refuse       −30
within their budget   +18     over budget            −3.2/RM
                              priced above fair      −12
```

55 or better sells. 85 or better delights them: reputation, a review on the book's page,
and they come back. Below 55 they decline, and the game tells you what they actually
wanted — the loss is the lesson.

Books also sell passively at a low rate when a browsing customer happens to be standing
next to something that suits them. This is deliberate: it means good curation earns money
even on days you talk to nobody, which is what a well-stocked shop actually feels like.

**CLOSED.** Takings, stock spend, rent. Reputation moves. Rent rises with level, so growth
is not free.

---

## 3. Progression

Reputation (0–100) is the single progression currency, earned by serving people well and
lost by letting them walk out.

| Level | At rep | Unlocks | Rent |
|---|---|---|---|
| 1 | 0 | 4 shelves, counter | RM120/day |
| 2 | 25 | Display table | RM170/day |
| 3 | 60 | **Kopi Corner** (cafe) | RM240/day |

The cafe is the expansion you asked about, and it earns its place mechanically rather than
cosmetically: it raises every customer's patience by 50%. In a game whose central scarcity
is *time to talk to people*, that is the most valuable thing you can buy. Potted palms do a
weaker version of the same job. Selling drinks is a later layer; the cafe already changes
how the shop plays without it.

---

## 4. The book layer

Any cover, anywhere — on a shelf, in the distributor list, in the recommendation picker —
opens the book's own page: cover, author, year, first-published date, genre and mood tags,
synopsis, themes, and reviews.

**On the reviews.** They are written by the game's own characters and labelled as such.
Attributing invented reviews to real readers would be dishonest, and scraped review text
carries licensing problems. In-world reviews are also better fiction: Puan Rosnah's opinion
of a book means something in a game where you know Puan Rosnah.

**On the catalogue.** 49 real titles with accurate authors and publication years, weighted
towards a shelf a Malaysian independent would actually keep — Tan Twan Eng, Preeta
Samarasan, Hanna Alkaf, Bernice Chauly, Rani Manicka alongside the international spine.
Zaid the unpublished novelist exists specifically to punish a shop that stocks only the
international list; he is the game telling you that curation has a point of view.

**On the buy button.** `ORDER A PHYSICAL COPY` shows price, courier, total, and delivery
window, and charges nothing. In the live build it opens checkout.

---

## 5. Known constraints of this prototype

- **No network.** The artifact sandbox blocks outbound requests and external images, so the
  catalogue is a frozen snapshot rather than a live Open Library query, and covers are
  generated procedurally from each book's own title, author and genre. The procedural
  covers are arguably correct for an 8-bit game regardless — a photographic cover scan
  would look wrong on this screen.
- **Sim depth is deliberately shallow.** No staff, no stock ageing, no seasonality, no
  competitor, no returns. Those are the obvious next systems, but none of them tests the
  core skill, so none of them belongs in a prototype meant to answer *is the matching loop
  fun*.
- **The shopkeeper does not move.** You stand behind the counter and customers route
  around you, but serving happens through the conversation panel rather than by walking
  the floor. Whether the player should have a body worth moving is an open design question,
  not an oversight.
- **Twelve NPC archetypes, three questions each.** Enough to prove the loop, not enough for
  retention. Repetition will set in within an hour, which is the expected failure of
  authored dialogue and the argument for the hybrid approach below.

---

## 6. Open questions

1. **Does the matching loop survive repetition?** Twelve archetypes with fixed wants will
   be solved quickly. The fix is either many more archetypes, or wants that vary per visit
   (same person, different errand), or the hybrid AI layer — authored spine, generated
   small talk. Worth deciding after playing, not before.
2. **How does stock actually arrive?** Right now the distributor offer is random. It should
   probably reflect the neighbourhood, so curation has information to work with.
3. **What does the cafe sell?** It currently buys time. Drinks, dwell time and a second
   revenue line are a whole second economy, and may be a sequel rather than a feature.
4. **Where does the storefront live?** The buy path is designed but not wired. The commerce
   integration is a separate piece of work with its own requirements.

---

## 7. Running it

Open `index.html` in any browser, or on a phone. No build step, no dependencies, no network.
