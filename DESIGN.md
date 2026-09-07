# Kedai Buku — design record

A mobile 16-bit bookshop simulator set in a Petaling Jaya shoplot, in which every book
is a real book and the player can order a physical copy.

This document records the decisions taken during the design session and the reasoning
behind them, so the prototype can be argued with rather than just played.

## Revision pass (day 2)

A round of playtest feedback asked for nine specific changes. What actually shipped:

| # | Ask | What changed |
|---|---|---|
| 1 | Make it a 16-bit game | Richer, multi-tone shading on sprites/furniture; brighter, more saturated palette throughout. See §1 and the art note below. |
| 2 | Sign is blurry | The shop sign is no longer drawn as canvas text (which blurs badly once a low-res canvas is upscaled). It's now a crisp HTML overlay in the pixel webfont, positioned over the signboard. |
| 3 | Design closer to Game Dev Story | Bright, rounded, "juicy" Kairosoft-style UI: rounded cards and buttons, drop shadows, chibi (big-headed) sprites. |
| 4 | Same character should appear more than once a day | `pickArchetype()` now biases spawns toward archetypes already in the shop or already seen that day — see §2. |
| 5 | Need more characters | Cast grew from 12 to 21 archetypes. |
| 6 | Start smaller, add a way to grow the space | New space-tier system: **Corner Kiosk → Shoplot Unit → Double Lot**, bought with cash and gated on reputation. See §3. |
| 7 | Book descriptions too short | Every blurb rewritten to a fuller paragraph (plot, tone, why it matters), not a single line. |
| 8 | RM150/day rent is too punishing | Rent is now tied to floor size, not reputation, and starts at **RM30/day** on the smallest lot, rising only when the player chooses to expand. See §3. |
| 9 | Reviews should be real, not invented NPC quotes | Replaced with an approximate real-world reader-rating aggregate (stars + rating count) per title. See §4 — this is the one ask that needed a genuine trade-off, explained there. |

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

**CLOSED.** Takings, stock spend, rent. Reputation moves. Rent is fixed for the day's floor
size, so growth is a choice the player makes and pays for once — not a background tax that
climbs on its own as reputation rises.

---

## 3. Progression

Progression now runs on two independent tracks, because they answer two different
questions and conflating them was the problem with the original single "level" — rent
was punishing the player for the same reputation gains that unlocked furniture.

**Reputation (0–100)** is earned by serving people well and lost by letting them walk out.
A sale is +2.4, a delighted customer +4.5, a walkout −0.4. It gates furniture unlocks and
raises how many customers show up.

| Level | At rep | Furniture unlocked |
|---|---|---|
| 1 | 0 | Shelf, counter |
| 2 | 18 | Display table |
| 3 | 45 | **Kopi Corner** (cafe) |

**Floor space** is a separate, player-chosen purchase: the shop starts on the smallest lot
and rent starts low, because RM150/day before the player has sold a single book was crushing
a prototype that is meant to teach the matching loop, not punish it before it starts.

| Tier | Size | Cost to buy | Needs rep | Rent |
|---|---|---|---|---|
| Corner Kiosk | 9×7, 2 shelves | — (starting lot) | — | **RM30/day** |
| Shoplot Unit | 12×9 | RM1,200 | 10 | RM70/day |
| Double Lot | 16×11 | RM3,200 | 30 | RM130/day |

Upgrading is a morning-only action in the SHOP tab. It keeps every shelf, the counter and
everything already stocked exactly where they are and simply extends the floor around them
— the player is never rebuilding a shop they already built.

The cafe is still the reputation-gated expansion from the original design, and it still
earns its place mechanically rather than cosmetically: it raises every customer's patience
by 50%. In a game whose central scarcity is *time to talk to people*, that is the most
valuable thing you can buy. Potted palms do a weaker version of the same job. Selling
drinks is a later layer; the cafe already changes how the shop plays without it.

---

## 4. The book layer

Any cover, anywhere — on a shelf, in the distributor list, in the recommendation picker —
opens the book's own page: cover, author, year, first-published date, genre and mood tags,
synopsis, themes, and reviews.

**On the reviews.** The brief asked for real reader reviews instead of invented NPC
quotes, and that's the right instinct — a made-up review attributed to a fake persona reads
as more authoritative than it is. What shipped is a **reader-rating aggregate**: stars,
an average out of 5, and a rating count, per title, framed the way a storefront actually
shows reception (Goodreads/StoryGraph-style), not as a pull-quote from an invented person.

This is a deliberate substitution, not the literal ask, for two reasons that didn't change
from the original design: this sandbox has no network, so nothing can be fetched live; and
reproducing real reviewers' actual review *text* without a license is a genuine copyright
and platform-ToS problem even outside the sandbox — a scraped quote is someone's copyrighted
writing, attributed without consent. An aggregate rating is closer to factual metadata than
to copyrightable expression, which is why it's the safer real-data substitute rather than
scraped prose. The numbers here are hand-set approximations of real-world reception, frozen
for the same no-network reason as the catalogue — a shipped build would replace `RATINGS`
with a live call to a ratings API and the number would simply be current instead of
approximate. The NPCs no longer author reviews at all; they only give you clue chips in
conversation, which is the part of them that was never claiming to be a real reader.

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
  covers are arguably correct for a 16-bit-style game regardless — a photographic cover
  scan would look wrong on this screen.
- **Sim depth is deliberately shallow.** No staff, no stock ageing, no seasonality, no
  competitor, no returns. Those are the obvious next systems, but none of them tests the
  core skill, so none of them belongs in a prototype meant to answer *is the matching loop
  fun*.
- **The shopkeeper does not move.** You stand behind the counter and customers route
  around you, but serving happens through the conversation panel rather than by walking
  the floor. Whether the player should have a body worth moving is an open design question,
  not an oversight.
- **Twenty-one NPC archetypes, three questions each.** Better retention than the original
  twelve, and spawns now deliberately reuse archetypes within a day — the same regular can
  turn up twice, sometimes two at once — which reads as a lived-in shop rather than a bug.
  But it's still a fixed roster with fixed wants; repetition will set in eventually, which
  is the expected failure of authored dialogue and the argument for the hybrid approach
  below.

---

## 6. Open questions

1. **Does the matching loop survive repetition?** Twenty-one archetypes with fixed wants
   will still be solved eventually, just later than twelve were. The fix is either more
   archetypes still, or wants that vary per visit (same person, different errand), or the
   hybrid AI layer — authored spine, generated small talk. Worth deciding after playing,
   not before.
2. **How does stock actually arrive?** Right now the distributor offer is random. It should
   probably reflect the neighbourhood, so curation has information to work with.
3. **What does the cafe sell?** It currently buys time. Drinks, dwell time and a second
   revenue line are a whole second economy, and may be a sequel rather than a feature.
4. **Where does the storefront live?** The buy path is designed but not wired. The commerce
   integration is a separate piece of work with its own requirements.

---

## 7. Running it

Open `index.html` in any browser, or on a phone. No build step, no dependencies, no network.
