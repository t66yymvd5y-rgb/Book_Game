# Corner Books — design record

A mobile 16-bit bookshop simulator set on an old shopping street, in which every book
is a real book and the player can order a physical copy.

## International edition

The game began as **Kedai Buku**, a Petaling Jaya shoplot priced in ringgit. It is now set in
an unnamed city's old quarter, so it reads the same anywhere. Older sections of this record
keep their original RM figures and names as history; the numbers carry over unchanged.

| Area | Now |
|---|---|
| Name | **Corner Books** by default. The player names the whole sign (up to 24 characters) instead of adding a name after "Kedai Buku". |
| Currency | `$`. Every number (costs, budgets, rent, the $1,500 start) is the same as the old RM figure, so balance is unchanged. |
| Space tiers | Corner Kiosk → Shopfront → Double Shopfront (were Shoplot Unit and Double Lot). |
| Cafe | Coffee Corner (was Kopi Corner). Courier is "Standard courier" (was Klang Valley). |
| Customers | All 40 keep their wants, budget and patience; local roles became their nearest equivalent (kopitiam → café, hawker stall → food truck, kuih seller → pastry stall). Twelve with Malaysian names were renamed (e.g. Puan Rosnah → Mrs Ferreira, Uncle Lim → Mr Rossi, Wei Lun → Kenji) and three lost a local honorific (Madam Wong → Mrs Wong, Uncle Raj → Raj, Auntie Grace → Grace), and Manglish and Malaysia-specific lines were rewritten in plain English. |
| Zaid | Still the curation test, now asking for **books in translation** rather than Malaysian authors. |
| Catalogue | The seven Malaysian titles were removed (123 books). *The Hunger Games* and *The Book Thief* moved to YA, which would otherwise be empty. |
| Saves | New save key (`cornerbooks.save.v1`): Kedai Buku saves do not carry over, because they reference removed books by index. |

This document records the decisions taken during the design session and the reasoning
behind them, so the prototype can be argued with rather than just played.

## Revision pass (main menu)

The game used to open straight onto the shop with a sheet already over it. It now has a
title screen and a menu you can reach during play.

| Area | What changed |
|---|---|
| Title screen | Every launch opens on the title screen: the keeper behind the counter, then **Continue** (only when there is a save, with its day, cash, reputation and lot), **New shop** and **How to play**. Continue appears once the save lookup finishes; a copy from the player's account that arrives late updates it in place. |
| New shop | With a save on file, New shop asks first. The old save is only replaced when the new shop first saves, so backing out of the naming screen loses nothing. |
| In-game menu | A menu button in the top bar (or Esc) opens Resume / How to play / Back to title / Start over. While it or the title is up, the trading clock stops, so no customer's patience runs down. |
| Back to title | Continue from there resumes the game in memory, mid-day included; nothing is reloaded. |
| Start over | Moved out of the SHOP tab into the menu. It still erases the save, then reloads straight into naming the new shop rather than back to the title. |
| How to play | The Morning / Open / Closed explainer plus how a sale is decided, readable at any time without starting a game. |
| Music on the title | The top-bar music button floats above pop-ups so it can be muted mid-conversation, which would also float it over the title. It is hidden while the title is up, and the title has its own Music on/off toggle for the same setting. |

## Revision pass (artifact sync)

The published Kedai Buku artifact had moved ahead of this repo. Its gameplay changes are now
folded in under the flat UI, and they supersede the older figures further down this document:

| Area | What changed |
|---|---|
| Saving | Progress saves automatically at each morning and evening, in the browser and (inside the artifact viewer) to the player's account; whichever copy is newer wins. Returning players get a Continue screen; the SHOP tab has Start over. |
| Reader memory | Each customer remembers what they bought here, won't buy it twice, and says so. |
| Footfall | Customers per day vary: a base from tier, level and reputation, plus a random swing and occasional busy days. |
| Pricing | AUTO now prices at 1.45× cost (was 1.75×), which put most titles over most customers' budgets. |
| Scoring | A sale needs 45 (was 55). Wrong genre is −8 rather than a hard miss; over-budget is penalised in proportion to how far over; each clue asked adds +3. |
| Cash | The HUD shows sen, so the till reconciles with the sales log. |

## Revision pass (visual overhaul)

The whole game was restyled to a flat, outlined UI kit look (white cards with a navy ink
outline sitting on offset blue / orange / yellow blocks, pill buttons, rounded sans type).
This supersedes the 16-bit / Kairosoft art direction in the day-2 pass below.

| Area | What changed |
|---|---|
| Menus | Stat strip HUD, orange tab bar with a yellow active pill, book cards with stars and price, a QTY-style price stepper, blue list panels for the shop and dialogue choices, a Total card at close. |
| Scene | Floor, walls, sign, storefront and furniture are now vector shapes with ink outlines, drawn at the stage's real device resolution instead of an upscaled pixel canvas. |
| People | The pixel sprite sheets were replaced by one shape-built figure (head, hair style, shirt, walk cycle, four facings) recoloured per customer. The keeper and the name-screen portrait use the same figure. |
| Covers | Flat covers: genre colour, one outlined motif, bold title. |

Game rules, scoring, prices and the catalogue are unchanged. The old sprite sheets live in git
history (commit `4399b1f`) if the pixel look is ever wanted back.

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
| Setting | Originally a Malaysian shoplot bookstore in RM; now an unnamed city's old quarter in $ (see International edition). The player names the shop; it is painted on the sign above the shelves. |

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
Kenji's is $30 whatever you think the book is worth.

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
within their budget   +18     over budget            −3.2/$
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
| 3 | 45 | **Coffee Corner** (cafe) |

**Floor space** is a separate, player-chosen purchase: the shop starts on the smallest lot
and rent starts low, because $150/day before the player has sold a single book was crushing
a prototype that is meant to teach the matching loop, not punish it before it starts.

| Tier | Size | Cost to buy | Needs rep | Rent |
|---|---|---|---|---|
| Corner Kiosk | 9×7, 2 shelves | — (starting lot) | — | **$30/day** |
| Shopfront | 12×9 | $1,200 | 10 | $70/day |
| Double Shopfront | 16×11 | $3,200 | 30 | $130/day |

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

**On the catalogue.** Real titles with accurate authors and publication years. The first
cut of 49 leaned towards a shelf a Malaysian independent would keep; those seven local
titles were removed for the international edition. Zaid the unpublished novelist exists
specifically to punish a shop that stocks only the obvious list — he now asks for books in
translation — and he is the game telling you that curation has a point of view.

**The Hundred Shelf.** The catalogue grew to 130 titles (123 after the Malaysian titles were removed): the original 49 plus 81 from a
"hundred books" list of classics, modern fiction and non-fiction (19 of its hundred were
already stocked). Saves key stock by array index, so new titles go at the end of `BOOKS`;
removing titles shifts indexes, which is why the international edition uses a fresh save key. Each keeps the source list's genre where the game has that shelf;
genres the game does not have are mapped to the nearest one a customer actually asks for:

| Source genre | Shelf |
|---|---|
| Gothic fiction | Horror (Frankenstein, Dorian Gray, Rebecca); Romance (Wuthering Heights) |
| Adventure, Satire, Fable | Literary |
| Historical fiction | History — 14 customers ask for History, and before this it held one book. *The Book Thief* later moved to YA. |
| Mystery, Thriller, True crime | Crime |
| Epic poetry | Poetry |
| Science fiction | Sci-Fi (*The Hunger Games* later moved to YA) |
| Science, Psychology | Non-Fiction |
| Memoir, Autobiography | Biography |
| Self-help, Economics, Finance, Strategy | Business |
| Political philosophy | Philosophy |

Ancient works carry a negative year (BC) and display as "c. 8th century BC"; anything
before AD 1000 shows as "c. AD 180". Ratings for the new titles are hand-set
approximations, like the rest of `RATINGS`. Years follow the source sheet's own rule (first book
form, not first serialisation), so three of its dates were corrected: Crime and Punishment
1867, The Picture of Dorian Gray 1891, Heart of Darkness 1902.

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
