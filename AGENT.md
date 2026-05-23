# AI Agent Guidelines (KeyMesh Documentation)

Welcome, AI Agent! If you are reading this, you have been tasked with modifying or maintaining the KeyMesh documentation repository. Please adhere strictly strictly to the following rules and guidelines to maintain the project's integrity.

## 1. Tech Stack (Strictly Vanilla)
- **HTML, CSS, JS ONLY**.
- **NO Frameworks**: Do not introduce React, Vue, Tailwind, Bootstrap, or any other framework.
- **NO Build Tools**: Do not add `package.json`, `node_modules`, Webpack, Vite, or npm dependencies.
- The entire site is a zero-dependency static Single Page Application (SPA).

## 2. Architecture & Routing
- **File Structure**:
  - `index.html`: Contains all the pre-rendered markdown content hidden in `<section>` tags.
  - `style.css`: Contains all styling.
  - `app.js`: Contains vanilla JavaScript for DOM manipulation and Hash Routing.
- **Routing**: Navigation is handled purely via URL hashes (e.g., `#getting-started-welcome`). `app.js` listens for `hashchange` events and toggles the `.active` class on the corresponding `<section>`.

## 3. Design System (Brutalism)
You must strictly follow the rules laid out in `DESIGN.md`. This is an unapologetic, anti-design brutalist system.
- **Colors**: Black (`#000000`), White (`#FFFFFF`), and Blue (`#0000FF` for links only).
- **Borders**: Thick black borders (1px, 3px, 5px).
- **Corners**: `0px` border radius everywhere. NO exceptions.
- **Shadows**: None. Visual hierarchy is achieved through border thickness.
- **Typography**: 
  - Headings: Archivo Black (uppercase)
  - Body: Work Sans
  - Code: Space Mono
- **Interactions**: Full color inversion on hover/active states (black becomes white, white becomes black). No smooth CSS transitions.

## 4. Modifying Content
- If asked to update documentation content, you must manually edit the HTML inside `index.html`.
- Keep the `<section>` IDs and the sidebar `data-id` attributes perfectly synchronized so that the hash routing continues to function.

## 5. Development Philosophy
- Keep it raw, fast, and simple.
- If a UI element looks too "polished" or "modern Web 3.0", strip it back. It should look like it was assembled from HTML primitives.
