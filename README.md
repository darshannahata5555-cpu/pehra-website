# Pehra website

Marketing site for the Pehra Insect Trap Pro. Static HTML, CSS and JS; no build step.

## Run locally
```
python3 -m http.server 4321
```
Then open http://localhost:4321.

## Structure
- `index.html`: all page sections
- `css/styles.css`: brand tokens (Pehra Colour Guide v2) and layout
- `js/main.js`: animations (GSAP + ScrollTrigger, Lenis smooth scroll) and interactions. Prices and the buy URL are in `CONFIG` at the top.
- `assets/images/`: product and lifestyle images (`01`–`10`, see `IMAGE-PROMPTS.md`)
- `assets/fonts/`: Neue Montreal (commercially licensed, so keep this repo private unless the licence allows redistribution)

## Open items
- Confirm the warranty wording (1-year warranty vs "4 years of lifetime")
- Confirm the stats and the comparison table
- Connect the newsletter form and the sachet "Add" button to Shopify
- Set the 4-pack sachet price in `CONFIG`
