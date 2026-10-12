# scrollcraft engine (vendored, unmodified)

From https://github.com/nateherkai/scroll-craft (v0.3.1, commit 75d81f7), MIT licence (see LICENSE).
`scrollcraft.js` and `scrollcraft.css` are copied verbatim; do not edit them. Theme them with the
`--sc-*` tokens in `src/app/globals.css`, and add page markup with `data-sc-*` attributes.
The CSS is imported into the lowest cascade layer (`scrollcraft`) so the site's own styles always win.
Mounted per page by `src/components/site/ScrollCraftMount.tsx`.
