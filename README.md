# Corner Books

A flat, cartoon-style bookshop simulator set on an old shopping street, where every book is a
real book and the player can order a physical copy.

Playable prototype: open `index.html` in any browser, desktop or phone. No build step,
no dependencies, no network.

Background music ("Paperback Afternoon") loops from `audio/paperback-afternoon.mp3`, so keep the
`audio/` folder next to `index.html`. It starts on the first tap (browsers block audio before
that). The note button in the top bar mutes it, and the choice is remembered on that device.

A new game opens with a short prelude: your grandfather has died and left you his bookshop,
and you decide to keep it going. The shop starts mature — twelve shelves holding 100 random
real books, one copy each, and his cat asleep in the corner. Every so often the cat gets up,
wanders across the floor, naps somewhere else and pads back to its cushion.

- **MORNING** — any orders due today are unpacked first, and a pop-up lists what was
  restocked. From day 2 the distributor's van brings 8 random titles you've never carried;
  order what you want before opening. Reorder, set prices (auto or by hand), fit out the shop.
- **OPEN** — customers arrive with patience running down. Tap one, ask up to three
  questions, then pull books for them: up to ten come off your shelves, mostly in the genres
  they read — up to five of them genuinely suit the customer, and just two of those are books
  they'd actually buy. You put up to six in front of them; if either of the two is there, they
  buy one. Regulars turn up more than once a day.
- **CLOSED** — count the takings, pay the rent, and restock: every sale is listed with a
  Restock button.

**Every order arrives two days after it is placed** — a reorder from the stock take, a
restock from the evening list, or a new title off the van — and is unpacked before the shop
opens that morning.

The clipboard button in the top bar opens the **stock take** at any time (the trading clock
stops while it's open): the whole inventory with full descriptions, filters by genre and by
era (pre-AD, AD 0–1500, 1501–1900, 1901–1950, 1951–2000, 2001–now), and reorders of any
title you carry or have sold out of. Its **Sold out** tab, and the Sold out list on the morning
Stock tab, restock any sold-out title with a +1 button. New titles only come on the van.

The blue **information counter** by the door holds grandfather's shop stamp — stamp in once a
day on a ten-day card, like the stamps Japanese bookshops keep for visitors — and a guest book
that customers sometimes sign when they buy. A **Display Table** (reputation level 2) shows two
featured titles: one lying flat and closed, one standing open.

Every pop-up has an X in its top-right corner that closes it from wherever you've scrolled to
(in a conversation, it lets the customer go back to browsing).

The title screen has Continue, New shop and How to play; the menu button (or Esc) pauses
a trading day and offers Resume, How to play, Back to title and Start over.

Grandfather's shop costs $50/day in rent. Reputation unlocks better furniture (the Coffee
Corner at level 3); cash and reputation together let you expand the floor for more shelves —
rent only rises when you choose to expand.

The skills the game tests are matching people to books, and choosing what to stock.
Pricing is a real system but not the point. You cannot go bankrupt. Progress saves
automatically, and regulars remember what they've already bought from you. Each book's page
carries a real-world reader-rating aggregate (stars + rating count), not an invented
character quote — see DESIGN.md §4 for what that does and doesn't mean offline.

See [DESIGN.md](DESIGN.md) for the decisions behind it, the scoring model, the
progression tiers, and the open questions.
