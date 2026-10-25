ARTICLE COPY BUTTON — TARGETED PATCH

Scope: src/pages/ArticlePage.jsx only.

Replace the existing src/pages/ArticlePage.jsx with the file in this patch, keeping the same path.

What this patch does:
- Preserves the existing copy button, clipboard API and fallback, success checkmark, error feedback, and textContent-based code extraction.
- Adds a MutationObserver so copy controls are also attached if article HTML/code blocks are inserted or replaced after the first render.
- Disconnects the observer when the article component unmounts.
- Does not change article CSS, code formatting, syntax highlighting, routes, APIs, or other components.

After replacing the file, build and deploy the site. Live browser verification was not possible from this environment, so do not consider the live completion criteria met until tested on the deployed article.
