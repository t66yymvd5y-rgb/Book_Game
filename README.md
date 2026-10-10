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
real books, one copy each, and his cat asleep in the corner.

- **MORNING** — from day 2 the distributor's van brings 8 random titles you've never
  carried; buy what you want before opening. Reorder, set prices (auto or by hand), fit out
  the shop.
- **OPEN** — customers arrive with patience running down. Tap one, ask up to three
  questions, then pull books for them: every book on your shelves in the genres they read
  comes out, and you put up to seven in front of them. If at least one genuinely suits
  them, it's even odds they buy the best one. Regulars turn up more than once a day.
- **CLOSED** — count the takings and pay the rent.

The clipboard button in the top bar opens the **stock take** at any time (the trading clock
stops while it's open): the whole inventory with full descriptions, filters by genre and by
era (pre-AD, AD 0–1500, 1501–1900, 1901–1950, 1951–2000, 2001–now), and reorders of any
title you carry or have sold out of. Reorders placed in the morning are shelved at once; ones
placed after opening arrive with the next morning's delivery. New titles only come on the van.

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
