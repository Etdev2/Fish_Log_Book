# Tackle Box — Product & UX Specification

**Status:** MVP / Ready for Implementation
**Feature:** Tackle Box
**Platform:** Mobile-first fishing application
**Document:** `docs/specs/tackle-box.md`

> Source of truth supplied by the product owner. Design decisions that implement
 * this spec live in `docs/design/08-tackle-box.md`.

---

# 1. Purpose

The Tackle Box is the user's personal fishing gear inventory.

The primary goal is simple:

> Let an angler quickly record what tackle they own and find it again without turning inventory management into a chore.

Some anglers may have hundreds or even thousands of pieces of tackle, especially hooks, jigs, hard baits, soft plastics, terminal tackle, line, and accessories.

The system therefore needs to work equally well for:

- A casual angler with 20 items
- A serious angler with hundreds of items
- A power user with thousands of tackle entries

The MVP should prioritize:

1. Extremely fast item entry
2. Fast search
3. Simple inventory management
4. Clear organization
5. Scalability
6. Mobile usability

Do NOT overload the first version with advanced features.

---

# 2. Core UX Principle

Adding tackle should never feel like filling out a database.

A user should be able to add a basic item in approximately **10 seconds or less**.

Finding an existing item should generally take **5 seconds or less**.

Required information should therefore be minimal.

Advanced information is optional.

---

# 3. Primary User Flow

The basic flow should be:

Tackle Box
↓
View Gear
↓
Search / Browse Categories
↓
Select Item

OR

Tackle Box
↓
Quick Add
↓
Choose Category
↓
Enter Name
↓
Quantity
↓
Save

The user should not have to navigate through several screens simply to add tackle.

---

# 4. Main Tackle Box Screen

The main screen should provide an immediate overview of the user's gear.

## Header

Display:

- Page title: `Tackle Box`
- Search
- Filter
- Sort

Search should be easy to access and preferably remain available while browsing large inventories.

---

# 5. Category System

Gear should be organized into broad categories.

Initial categories may include:

- Lures
- Hooks
- Jigs
- Soft Plastics
- Hard Baits
- Terminal Tackle
- Line
- Leaders
- Sinkers / Weights
- Swivels
- Rods
- Reels
- Tools
- Accessories
- Other

Categories should NOT be hard-coded in a way that prevents expansion later.

Additional categories can be introduced as the application develops.

---

# 6. Category Cards

The main Tackle Box can display category cards.

Example:

Hooks
124 items

Lures
86 items

Line
12 items

Rods
7 items

Reels
9 items

Each category card should contain:

- Category icon or image
- Category name
- Number of inventory entries

Selecting the category opens its inventory.

---

# 7. Gear Inventory List

Inside a category, display the user's tackle as a clean list or compact card system.

A gear entry can display:

- Image
- Item name
- Brand
- Size
- Color
- Quantity
- Favorite indicator

Do not display every available attribute directly on the card.

The card should remain visually clean and easy to scan.

Selecting an item opens its detailed information.

---

# 8. Quick Add

Quick Add is one of the most important components of this feature.

A prominent `+ Add Gear` action should always be easy to reach.

On mobile, this may be implemented as:

- Floating action button
- Bottom action button
- Persistent add control

Use whichever pattern best matches the application's existing design system.

---

# 9. Quick Add Form

The initial form should contain only the information necessary to create an inventory entry.

## Required

- Category
- Item name
- Quantity

## Optional

- Photo
- Brand
- Size
- Color
- Weight
- Notes
- Tags
- Favorite

The user must NOT be required to complete optional fields.

Example:

Category:
Hooks

Name:
Owner Mutu Circle Hook

Quantity:
25

[ Save ]

That should be enough to create the item.

---

# 10. Fast Entry Features

Because anglers may need to enter large tackle collections, optimize aggressively for repetitive entry.

## Remember Recent Values

The system may remember recently used:

- Category
- Brand
- Size
- Color

Example:

A user is entering 20 different hook sizes.

Instead of repeatedly selecting:

Hooks → Owner → Mutu Circle

the application can preserve relevant previous selections.

---

# 11. Duplicate Item

Every inventory item should have:

`Duplicate`

This is especially important for tackle.

Example:

Owner Mutu Circle Hook
Size 2/0
Quantity 25

Duplicate →

Owner Mutu Circle Hook
Size 3/0
Quantity 20

The user should only need to change the fields that differ.

This dramatically reduces entry time for large tackle collections.

---

# 12. Quantity Controls

Quantity should be easy to adjust.

Where appropriate provide:

`−  12  +`

The user should not need to open the full edit form just to change inventory quantity.

Quantity must never become negative.

---

# 13. Search

Search must be fast and available from the primary Tackle Box interface.

Search should eventually support:

- Name
- Brand
- Category
- Size
- Color
- Tags

Example searches:

`circle hook`

`owner`

`bluefin`

`200 lb`

`Nomad`

Search results should update quickly.

---

# 14. Filters

Initial filters:

- Category
- Brand
- Size
- Color
- Favorites
- Low Stock

Future filters can be added as necessary.

Avoid presenting a huge filter interface by default.

Use a filter sheet/modal if necessary.

---

# 15. Sorting

Support basic sorting such as:

- Name
- Category
- Recently Added
- Recently Updated
- Quantity
- Brand

The default sort should prioritize usability rather than exposing every possible option.

---

# 16. Tags

Users may optionally add tags.

Example tags:

- Bluefin
- Yellowtail
- Calico Bass
- Catalina
- Offshore
- Inshore
- Surface Iron
- Night Fishing

Tags are optional in the MVP but the data model should support them.

Tags will become useful later for recommendations and Fish Log analytics.

---

# 17. Item Detail

Selecting an inventory item should open a detail view.

Possible information:

## Primary

- Photo
- Name
- Category
- Quantity

## Additional

- Brand
- Size
- Color
- Weight
- Notes
- Tags

## Actions

- Edit
- Duplicate
- Adjust Quantity
- Favorite
- Delete

---

# 18. Delete Behavior

Deleting inventory should require protection against accidental taps.

Use either:

- Confirmation dialog

or

- Undo after deletion

Avoid destructive actions directly beside commonly used controls.

---

# 19. Images

Images are optional.

Users should be able to:

- Take a photo
- Select an existing photo
- Use no photo

Do NOT require photography to add an item.

If no image exists, display an appropriate category icon or placeholder.

---

# 20. Data Model

Use a flexible gear inventory model.

Example conceptual structure:

gear_items

- id
- user_id
- category_id
- name
- brand
- size
- color
- weight
- quantity
- notes
- image_url
- favorite
- created_at
- updated_at

Tags may use either:

- Structured relationship table

or

- Existing project tagging architecture

depending on the current database design.

Every gear item must have a persistent unique ID.

---

# 21. Why Unique IDs Matter

Gear should eventually connect to other parts of the fishing application.

Example:

Fish Log Catch
↓
Gear Used
↓
Specific Tackle Box Item

This allows the application to eventually answer questions such as:

- Which lure catches the most fish?
- Which hook size performs best?
- Which gear works best for bluefin?
- Which tackle performs best under certain tide conditions?
- What gear should I pack for tomorrow?

Therefore gear should never be identified solely by its display name.

Use persistent IDs.

---

# 22. Scale Requirements

Assume some users will have very large tackle collections.

Design for at least:

**5,000 inventory entries per user**

without significant UX degradation.

Consider:

- Efficient list rendering
- Pagination or virtualization where appropriate
- Indexed search fields
- Efficient filtering
- Image optimization

Do not render thousands of heavy image cards simultaneously.

---

# 23. Mobile UX Requirements

The application is mobile-first.

Primary actions should be reachable with one hand.

Avoid:

- Tiny tap targets
- Excessive vertical scrolling
- Deep nested menus
- Long forms
- Desktop-style inventory tables
- Important controls near unsafe screen edges

Use bottom sheets where appropriate.

---

# 24. Visual Alignment & Layout Standards

The interface should feel deliberately constructed rather than having components visually floating around the page.

Everything should follow a consistent alignment system.

## Alignment

Components should align clearly along both:

- X-axis
- Y-axis

Cards, text, icons, buttons, headers, inputs, and margins should share common alignment lines.

## Spacing

Use a consistent spacing system.

Avoid arbitrary margins and padding.

Related elements should be visually grouped.

Unrelated elements should have greater separation.

## Typography

Typography must communicate hierarchy.

For example:

Page Title
↓
Section Heading
↓
Item Name
↓
Supporting Metadata

Font size, weight, and color should reflect importance.

Do not use typography variations without a functional reason.

## Color

Colors should follow the application's existing design system.

Color should communicate:

- hierarchy
- state
- interaction
- status

Avoid decorative color that creates unnecessary visual noise.

## Overall Goal

When viewing the screen, nothing should appear randomly positioned.

The page should feel symmetrical, balanced, intentional, and professionally laid out.

---

# 25. Empty State

A new user with no tackle should not see an empty blank screen.

Example:

## Your Tackle Box is Empty

Add your fishing gear so you can organize tackle, prepare for trips, and eventually track which gear catches fish.

[ + Add Your First Item ]

Keep the experience simple.

---

# 26. MVP Scope

Build now:

- Tackle Box main screen
- Category browsing
- Gear inventory
- Quick Add
- Gear details
- Edit gear
- Delete gear
- Duplicate gear
- Quantity adjustment
- Search
- Basic filters
- Basic sorting
- Favorites
- Optional images
- Optional tags

---

# 27. NOT MVP

Do NOT delay the initial feature to build these.

Future functionality includes:

- CSV bulk import
- Barcode scanning
- AI image recognition
- Automatic product identification
- Retail product database
- Affiliate shopping
- Automatic low-stock purchasing
- Advanced gear analytics

The architecture may anticipate these features, but they are not required for the initial implementation.

---

# 28. Future — Shopping List

Users will eventually be able to add tackle to a shopping list.

Example:

Shopping List

Owner Mutu Circle Hooks 4/0
Qty needed: 20

200 lb Fluorocarbon
Qty needed: 1

Knife
Qty needed: 1

Items may eventually be manually added or generated from low inventory.

---

# 29. Future — Trip Loadouts

The Tackle Box will eventually connect with upcoming fishing trips.

Example:

## Tomorrow — Catalina

Recommended / Required Gear

✓ Surface iron
✓ 30 lb setup
✓ Hooks
✗ Fluorocarbon
✗ Sinkers

The system can compare:

Trip requirements
vs.
Tackle Box inventory

and identify missing items.

---

# 30. Future — Fish Log Integration

This is an important architectural requirement.

Fish Log entries should eventually reference Tackle Box items.

Example:

Catch:

Species:
Bluefin Tuna

Weight:
84 lb

Lure:
Nomad Streaker 200g

Hook:
Owner Jobu

Gear IDs should be stored with the catch when appropriate.

---

# 31. Future — Gear Performance

Once enough Fish Log data exists, the application can calculate gear performance.

Example:

## Your Top Bluefin Lures

Nomad Streaker
18 catches

Colt Sniper
11 catches

Flat Fall
7 catches

This transforms the Tackle Box from simple inventory into fishing intelligence.

---

# 32. Future — Environmental Correlation

Eventually combine:

- Tackle Box
- Fish Log
- Tide data
- Moon phase
- Water temperature
- Weather
- Location
- Time
- Species
- Catch results

This could produce insights such as:

> Your highest bluefin catch rate occurs with 200–250g knife jigs during the first two hours of an incoming tide.

These features are NOT part of the current Tackle Box MVP.

However, the data model should avoid architectural decisions that make this integration difficult later.

---

# 33. Performance Goals

Target:

Add basic gear:
**< 10 seconds**

Find existing gear:
**< 5 seconds**

Quantity update:
**1–2 interactions**

Duplicate similar gear:
**< 5 seconds**

Search response should feel effectively instant for normal inventory sizes.

---

# 34. Accessibility

Follow standard mobile accessibility practices.

Include:

- Appropriate tap target sizes
- Sufficient text contrast
- Accessible labels for icons
- Screen-reader-friendly controls
- Do not communicate state through color alone

---

# 35. Acceptance Criteria

The MVP is complete when:

- User can open Tackle Box.
- User can browse gear categories.
- User can add an item using only category, name, and quantity.
- User can optionally add additional attributes.
- User can edit an item.
- User can delete an item safely.
- User can duplicate an item.
- User can adjust quantity quickly.
- User can search inventory.
- User can filter inventory.
- User can sort inventory.
- User can favorite items.
- Inventory remains usable with large numbers of items.
- UI follows the application's existing design system.
- Layout is visually aligned and consistent.
- Gear records have persistent unique IDs.
- Architecture allows future Fish Log relationships.

---

# 36. Implementation Priority

Recommended implementation order:

1. Review existing application architecture and design system.
2. Review existing database schema before creating migrations.
3. Define gear inventory data model.
4. Build Tackle Box screen shell.
5. Build category navigation.
6. Build Quick Add.
7. Build inventory list.
8. Build item detail/edit.
9. Add duplicate functionality.
10. Add quantity controls.
11. Add search.
12. Add filters and sorting.
13. Add favorites.
14. Add optional image support.
15. Test with large mock inventory.
16. Polish alignment, spacing, typography, and mobile ergonomics.

---

# 37. Agent Instructions

Before implementing this specification:

1. Inspect the existing repository.
2. Identify the current application architecture.
3. Identify the existing design system/components.
4. Identify the existing database schema.
5. Reuse existing components where appropriate.
6. Do not introduce a second design language.
7. Do not unnecessarily rewrite unrelated code.
8. Do not implement future features unless required to support the MVP architecture.
9. Keep changes modular and reviewable.
10. Preserve future compatibility with Fish Log and Trip Planning.

If this specification conflicts with an established project-wide architectural decision, flag the conflict before making a major architectural change.

---

# 38. Product Principle

The Tackle Box should start as:

**A very good fishing gear inventory.**

It should NOT initially try to be:

- A fishing store
- An AI assistant
- A recommendation engine
- A complicated warehouse management system

Build the inventory foundation correctly first.

Later:

Tackle Box
+
Fish Log
+
Trip Planning
+
Tides / Conditions
=
Personalized Fishing Intelligence
