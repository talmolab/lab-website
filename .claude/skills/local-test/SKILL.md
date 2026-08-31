---
name: local-test
description: Test the local Astro build and visualise pages in a browser. Runs the schema check, starts a dev or preview server, walks the key pages, captures screenshots, and validates rendering. Use when testing local changes before deployment.
version: 1.0.0
allowed-tools: Bash, BashOutput, KillShell, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_click, TodoWrite
---

# Local Testing

Test the Astro site locally and look at it in a browser.

Two servers, and the difference matters:

| Command | Serves | Use it for |
|---|---|---|
| `npm run dev` | Astro dev server, HMR, no Pagefind index | content and layout work |
| `npm run preview` | `wrangler dev` over `dist/` | anything about **routing** |

Routing must be checked under `wrangler dev`, not `astro dev`. The `.html` → 301
member redirects, the trailing-slash behaviour and `public/_redirects` are all
applied by the Workers runtime and simply do not exist in the dev server. A URL can
look fine in `astro dev` and 404 in production.

## When to Use This Skill

Use this skill when:
- "Test the local build"
- "Preview the site locally"
- "Visualize local changes"
- "Test with Playwright"
- "Check how the site looks"
- Before committing major changes
- After updating member profiles or content
- When debugging layout or rendering issues

## Prerequisites

Node 24+. No Ruby, no bundler — the Jekyll toolchain is gone.

Browser automation: prefer the built-in Browser tools
(`mcp__Claude_Browser__navigate`, `read_page`, `computer`, `javascript_tool`).
Playwright MCP also works if it is configured; the flow below is the same either
way. When the Browser pane is hidden, prefer `read_page` / `get_page_text` over
screenshots — a hidden pane returns blank images.

## Workflow

### Step 1: Start the Dev Server

1. **Launch the server in background**:
   ```bash
   npm run dev            # content work
   # or
   npm run preview        # routing work — needs `npm run build` first
   ```

   Use `run_in_background: true` to keep the server running while testing.

2. **Wait for server initialization** (8-10 seconds):
   ```bash
   sleep 8
   ```

3. **Check server output**:
   - Use `BashOutput` to verify server started successfully
   - `astro dev` serves `http://localhost:4321/`
   - `wrangler dev` serves `http://localhost:8787/`
   - Look for "Server running..." message

### Step 2: Navigate to Homepage

1. **Open homepage with Playwright**:
   ```
   mcp__playwright__browser_navigate
   url: http://localhost:4321/
   ```

2. **Verify page loaded**:
   - Check page title: "Talmo Lab - Home"
   - Review page snapshot structure
   - Look for key elements (banner, navigation, content)

3. **Capture full-page screenshot**:
   ```
   mcp__playwright__browser_take_screenshot
   filename: homepage-screenshot.png
   type: png
   fullPage: true
   ```

### Step 3: Test Key Pages

Navigate and capture screenshots of important pages:

#### Team Page
```
mcp__playwright__browser_navigate
url: http://localhost:4321/team/
```
- Verify all member portraits load
- Check alumni section formatting
- Take full-page screenshot: `team-page-screenshot.png`

#### Research Page
```
mcp__playwright__browser_navigate
url: http://localhost:4321/research/
```
- Verify research areas display correctly
- Check images and formatting
- Take screenshot: `research-page-screenshot.png`

#### Publications Page
```
mcp__playwright__browser_navigate
url: http://localhost:4321/publications/
```
- Verify citations render properly
- Check publication cards/entries
- Take screenshot: `publications-page-screenshot.png`

#### Individual Member Profile
```
mcp__playwright__browser_navigate
url: http://localhost:8787/members/talmo-pereira.html   # 301 -> extensionless; only correct under wrangler
```
- Verify profile image displays
- Check bio formatting
- Verify social links work
- Take screenshot: `member-profile-screenshot.png`

### Step 4: Test Interactive Elements (Optional)

If testing navigation or interactive features:

1. **Click navigation links**:
   ```
   mcp__playwright__browser_click
   element: "Research navigation link"
   ref: [element reference from snapshot]
   ```

2. **Hover over portraits**:
   ```
   mcp__playwright__browser_hover
   element: "Member portrait"
   ref: [element reference]
   ```

3. **Test responsive behavior**:
   ```
   mcp__playwright__browser_resize
   width: 375
   height: 667
   ```
   Then take screenshots at mobile size.

### Step 5: Check Console for Errors

Look for any JavaScript errors or 404s:
```
mcp__playwright__browser_console_messages
onlyErrors: true
```

Common issues to check:
- Missing images (404 errors)
- Failed CSS/JS loads
- JavaScript runtime errors

### Step 6: Review Screenshots

Present screenshots to user:
- Show what pages were tested
- Highlight any rendering issues
- Note any console errors found
- Summarize overall build health

### Step 7: Cleanup

1. **Stop the server**:
   ```
   KillShell
   shell_id: [server shell ID]
   ```

2. **Confirm cleanup**:
   - Verify server stopped
   - Screenshots from Playwright MCP land in `.playwright-mcp/` (gitignored)

## Common Testing Scenarios

### Testing New Member Profile

When adding a new member:

1. Start server
2. Navigate to team page → verify member appears
3. Navigate to member profile → verify all fields render
4. Check profile image displays correctly
5. Verify links (email, GitHub, etc.) are present
6. Take screenshots of both pages

### Testing Layout Changes

When modifying CSS or templates:

1. Start server with livereload
2. Navigate to affected pages
3. Take "before" screenshots
4. Make changes (livereload will auto-refresh)
5. Take "after" screenshots
6. Compare visually

### Testing Publications

When updating `_data/sources.yaml`:

1. Run `./cite.sh` to generate citations
2. Start server
3. Navigate to publications page
4. Verify new publications appear
5. Check formatting of citations
6. Verify links and images

### Full Site Regression Test

Before major deployments:

1. Test all main pages (home, team, research, publications, join)
2. Test sample member profiles (PI, PhD, undergrad, alumni)
3. Check footer and navigation on all pages
4. Test at desktop and mobile sizes
5. Review console for any errors
6. Capture screenshots of all tested pages

## Screenshot Storage

All screenshots are saved to `.playwright-mcp/` directory:
- This directory is automatically gitignored
- Screenshots are for local review only
- Filenames should be descriptive (e.g., `team-page-screenshot.png`)
- Full-page screenshots recommended for complete context

## Troubleshooting

### Server Won't Start

**Error: "Address already in use"**
- Check whether a server is already bound: `lsof -i :4321` (astro) or `lsof -i :8787` (wrangler)
- Kill existing process: `kill -9 [PID]`
- Restart server

**Error: "Permission denied"**
- Don't run `./start.sh` directly (may not be executable)
- Use: `npm run dev`, or `npm run preview` for routing

### Playwright Can't Connect

**Error: "Navigation failed"**
- Ensure server is fully started (wait 8-10 seconds)
- Check server logs with `BashOutput`
- Verify URL is `http://localhost:4321/` (not localhost)

**Error: "Browser not installed"**
- Run: `mcp__playwright__browser_install`

### Page Rendering Issues

**Images not loading**
- Check file paths in frontmatter
- Verify images exist in `images/` directory
- Look for 404 errors in console

**Styling broken**
- Check for CSS compilation errors in server logs
- Verify `_sass/` files are valid
- Check browser console for CSS load failures

**Content missing**
- Verify frontmatter is valid YAML
- Check the build output for warnings. Two are expected until the blog has
  content: `The collection "posts"/"news" does not exist or is empty`.
- Look for Liquid template errors in server logs

## Best Practices

1. **Always test locally before committing**:
   - Catches rendering issues early
   - Validates new content appears correctly
   - Ensures no broken links or images

2. **Use descriptive screenshot filenames**:
   - Include page name and purpose
   - Add date for tracking changes over time
   - Example: `team-page-new-members-2025-10-31.png`

3. **Test multiple page types**:
   - Don't just test homepage
   - Verify collection pages (team, publications)
   - Check individual item pages (member profiles)

4. **Keep server logs**:
   - Check `BashOutput` periodically
   - Look for build warnings
   - Note any deprecation notices

5. **Clean up after testing**:
   - Always kill the server when done
   - Review and delete old screenshots
   - Check for any uncommitted test files

## Integration with Development Workflow

### Standard Development Cycle

1. Make changes to content/code
2. Run this skill to test locally
3. Review screenshots and console output
4. Fix any issues found
5. Re-test until satisfied
6. Commit changes
7. Push to GitHub (auto-deploys via GitHub Actions)

### Pre-Commit Hook Integration

Consider testing before commits:
```bash
# In .git/hooks/pre-commit
npm run build
```

### Continuous Testing

For ongoing development:
- Leave server running with livereload
- Make changes and watch auto-refresh
- Use Playwright to capture specific states
- Take screenshots at milestones

## See Also

- [Astro Documentation](https://docs.astro.build/)
- [Workers static assets routing](https://developers.cloudflare.com/workers/static-assets/routing/)
- [Playwright MCP Documentation](https://github.com/anthropics/mcp-playwright)
- CLAUDE.md - Project-specific development guidelines
- `.github/workflows/` - CI/CD configuration


---

## Checks worth running before you commit

### 1. The schema check — not optional

```bash
npm run check
```

There is no CMS, so the Zod schemas are the only thing validating content input
(§7). This catches an unknown role, a malformed `YYYY-MM`, a bad `reference()`
slug, and a portrait path that points outside `src/`. `npm run build` runs it too.

### 2. The URL preservation gate

```bash
npm run build && npm run preview          # in one shell
./scripts/check-urls.sh http://localhost:8787   # in another
```

Asserts every URL the live Jekyll site serves still resolves — 72 paths snapshotted
in `test/live-urls.txt`. **This gates cutover.** The URLs that break silently are
external ones: CVs, the SLEAP docs, other lab sites, Google's index of the `.html`
member pages. Nobody reports those.

### 3. Stale content cache

If a loader change appears to do nothing, the content layer is serving cache:

```bash
rm -f node_modules/.astro/data-store.json
```

It is in `node_modules/.astro/`, **not** `.astro/`. Deleting the latter looks like
it should work and does not.

### 4. Both themes

The palette has three states — explicit light, explicit dark, and system. Check
light and dark; `prefers-color-scheme` alone separates the default case. Contrast
regressions hide in the theme you did not look at: a token that is correct as
foreground can fail as a fill.
