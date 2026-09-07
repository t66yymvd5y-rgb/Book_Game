# Kedai Buku

A 16-bit-style bookshop simulator set in a Petaling Jaya shoplot, where every book is a
real book and the player can order a physical copy.

Playable prototype: open `index.html` in any browser, desktop or phone. No build step,
no dependencies, no network.

- **MORNING** — buy stock from the distributor, set prices (auto or by hand), fit out the shop.
- **OPEN** — customers arrive with patience running down. Tap one, ask up to three
  questions, then recommend a book off your own shelves. Regulars turn up more than once
  a day, sometimes two at a time.
- **CLOSED** — count the takings and pay the rent.

You start on a small corner kiosk at RM30/day rent. Reputation unlocks better furniture;
cash and reputation together unlock bigger lots — rent only rises when you choose to
expand into one.

The skills the game tests are matching people to books, and choosing what to stock.
Pricing is a real system but not the point. You cannot go bankrupt. Each book's page
carries a real-world reader-rating aggregate (stars + rating count), not an invented
character quote — see DESIGN.md §4 for what that does and doesn't mean offline.

See [DESIGN.md](DESIGN.md) for the decisions behind it, the scoring model, the
progression tiers, and the open questions.
