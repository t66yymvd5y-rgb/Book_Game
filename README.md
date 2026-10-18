# Corner Books

A flat, cartoon-style bookshop simulator set on an old shopping street, where every book is a
real book and the player can order a physical copy.

Playable prototype: open `index.html` in any browser, desktop or phone. No build step,
no dependencies, no network.

Background music is a four-track playlist in `audio/` ("Paperback Afternoon", "A Chapter for
Later", "A Quiet Corner", "Sunlight on the Shelf"), played in order and looped, so keep the
`audio/` folder next to `index.html`. It starts on the first tap (browsers block audio before
that). The note button in the top bar mutes it, and the choice is remembered on that device.

A new game opens with a short prelude: your grandfather has died and left you his bookshop,
and you decide to keep it going. The shop starts mature — twelve shelves holding 100 random
real books, one copy each, and his cat asleep in the corner.

- **MORNING** — from day 2 the distributor's van brings 8 random titles you've never
  carried; order what you want before opening. Reorder, set prices (auto or by hand), fit out
  the shop.
- **OPEN** — customers arrive with patience running down. Tap one, ask up to three
  questions, then pull books for them: up to ten come off your shelves, mostly in the genres
  they read, and you put up to six in front of them. Only some of the ten suit them, and only
  two are books they'd actually buy — get either onto the pile and they take one home.
- **CLOSED** — count the takings, pay the rent, and restock what sold.

Every order — a reorder, a restock or a title off the van — arrives two mornings after you
place it, before the shop opens.

The clipboard button in the top bar opens the **stock take** at any time (the trading clock
stops while it's open): the whole inventory with full descriptions, filters by genre and by
era (pre-AD, AD 0–1500, 1501–1900, 1901–1950, 1951–2000, 2001–now), reorders of any title
you carry, and a Sold out tab that restocks with one tap. New titles only come on the van.

The blue information counter by the door holds grandfather's shop stamp, for checking in each
day, and a guest book that customers sign when they buy. His cat wanders off its cushion now
and then for a nap somewhere else on the floor.

On the other side of the door, the **magazine rack** introduces one new real magazine every
real-world week (Monday to Sunday, on the player's clock); a yellow dot over it means this
week's title is waiting. The list lives in `MAGAZINES` in `index.html` and currently holds
*Monocle*. In the corner by the window, grandfather's **record corner** — a turntable on a
sideboard of records — plays the soundtrack: tap it to drop the needle on any of the four
tracks, or lift it to stop the music.

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
