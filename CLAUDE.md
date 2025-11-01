# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Jekyll-based academic lab website (Jekyll 3.10.0) based on the [greenelab/lab-website-template](https://github.com/greenelab/lab-website-template). The site features a custom member management system, automated publication citations, and two custom Claude skills for common workflows.

**Live site**: https://talmolab.org

## Development Commands

### Local Preview
```bash
./start.sh
# or
bundle exec jekyll serve --force_polling --livereload
```

### Citation Management
Auto-cite runs automatically via GitHub Actions when `_data/sources.yaml` is pushed. To run manually:
```bash
./cite.sh
# or
python ./auto-cite/auto-cite.py
```

### Playwright Testing (Optional MCP)
```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

## Jekyll Architecture

### Collections & Layouts
- **Members collection** (`_members/`): Primary collection (not blog posts)
- **Auto-layouts**: `member` for `_members/`, `post` for `_posts/`, `default` for everything else
- **Base URL**: Empty (root domain deployment)

### Key Configuration (_config.yml)
- Jekyll 3.10.0 with members collection enabled
- Auto-cite transforms `_data/sources.yaml` → `_data/citations.yaml`
- Plugins: jekyll-redirect-from, jekyll-sitemap

## Team/Member System

This is the most complex part requiring coordination across multiple files:

### Three-Component Architecture

1. **Member Files** (`_members/firstname-lastname.md`):
   - YAML frontmatter with: `name`, `image`, `role` (required)
   - Optional: `description`, `links` (email, github, linkedin, home-page, twitter)
   - Markdown bio (third person, role-specific length)
   - Creates individual pages at `/members/firstname-lastname.html`

2. **Roles Data** (`_data/roles.yaml`):
   - Maps role codes to display text and Font Awesome icons
   - Valid roles: `pi`, `postdoc`, `staff`, `phd`, `ms`, `ra`, `programmer`, `undergrad`, `highschool`, `alumni`, `friends`

3. **Team Page** (`team/index.md`):
   - Uses `{% include list.html %}` with `filters="role: pi"` syntax
   - Displays active members grouped by role
   - **Alumni section** (lines 92-125): Manually maintained list, **not** auto-generated

### Member Workflow Patterns

**Adding new member**:
- Create `_members/firstname-lastname.md` (lowercase, hyphenated)
- Add image as `images/firstname-lastname.jpg` (matches slug)
- Use **add-member skill** for guided workflow with web research

**Role transitions** (e.g., undergrad → MS → PhD):
- Keep same member file
- Update `role:` field in frontmatter
- Roster tracking (via lab-roster skill) creates separate entries per role period

**Marking as alumni**:
1. Change `role:` to `alumni` in member file
2. Manually add entry to `team/index.md` alumni section:
   ```markdown
   - YEAR: [**Name**](/members/slug.html) (Role Description). **Next:** Position
   ```
3. Member page stays live (linked from alumni list)

### Team Assignment

Three teams (inferred from bio keywords by lab-roster skill):
- `software_engineering`: SLEAP, DREEM, cloud, infrastructure, pose estimation
- `phenoinformatics`: behavioral phenotyping, ALS, Alzheimer's, disease models
- `virtual_biology`: VNL, virtual animals, embodied simulations, neuromechanical

## Publication/Citation System

**Two-stage automated process**:

1. **Manual editing**: Add entries to `_data/sources.yaml`
   - DOI-based: `id: doi:10.1038/...` (metadata auto-fetched)
   - Manual: Full YAML with title, authors, publisher, date, link, image

2. **Auto-cite**: GitHub Action runs on push
   - Fetches metadata from DOIs
   - Generates `_data/citations.yaml`
   - Commits result back to repo

**Local run**: Use `./cite.sh` when testing citation changes before push

## Custom Claude Skills

Located in `.claude/skills/`, these auto-activate on relevant requests:

### lab-roster
**Purpose**: Generate comprehensive CSV roster with role transitions, dates, team assignments, career tracking

**Two modes**:
- **Quick**: `generate_roster_csv.py` analyzes git history, outputs CSV directly
- **Comprehensive**: Uses subagents to gather info, creates `ROSTER.md` + CSV

**Tracks**: start_date, end_date, team, co_advisor, previous_position, next_position

**Auto-activates on**: "roster", "generate roster", "team list", "lab members"

**Output**: `lab_roster.csv` with one row per role (multiple rows for members who transitioned)

### add-member
**Purpose**: Interactive guide for adding new members with web research, bio drafting, image optimization

**Workflow**:
1. Gather info (name, role, email, links)
2. Web research (LinkedIn, GitHub, institutional pages)
3. Draft bio using role-appropriate template
4. Optimize image (target: 100-250KB, square, 400-600px)
5. Generate member file
6. Update alumni list if applicable

**Auto-activates on**: "add new member", "add [name] to team", "mark [name] as alumni"

**Bio guidelines**:
- Third person throughout
- Length by role: PI (250-300 words), students/staff (100-150), undergrads (80-100), summer interns (50-80)
- Include: education, join date, research focus, co-advisor (if applicable)

**Image handling**: Uses `optimize-image.sh` (sips on macOS, ImageMagick on Linux)

## Directory Structure

### Content Directories
- `_members/`: Member markdown files (55 files)
- `_data/`: YAML data (roles, sources, citations, links, tools)
- `_includes/`: 33 Liquid components (list.html, portrait.html, etc.)
- `_layouts/`: 3 page templates (default, member, post)
- `images/`: Profile photos (`firstname-lastname.jpg` naming)
- `team/`: Team page with manual alumni section
- `research/`: Research areas
- `join/`: Recruitment information

### Key Files
- `_config.yml`: Jekyll configuration
- `Gemfile`: Ruby dependencies
- `start.sh`: Local preview launcher
- `cite.sh`: Manual citation update
- `.claude/skills/`: Custom automation skills

## Naming Conventions

**Critical patterns** (many things break if these aren't followed):
- Member files: `_members/firstname-lastname.md` (lowercase, hyphenated)
- Member images: `images/firstname-lastname.jpg` (must match file slug)
- Member URLs: `/members/firstname-lastname.html` (auto-generated by Jekyll)
- Role codes: Must match exact keys from `_data/roles.yaml`

## Liquid Templating Patterns

### List Include with Filters
```liquid
{% include list.html data="members" component="portrait" filters="role: phd" %}
```
- `data`: Collection name
- `component`: Component to render each item (portrait.html, card.html, etc.)
- `filters`: Space-separated filters (e.g., `"role: phd"`, `"group: featured"`)

### Component Rendering
Most includes expect: name, image, role/type, description, link/links

## Git & Deployment

**GitHub Actions**:
- Auto-cite runs on push to `_data/sources.yaml` or `_data/orcid.yaml`
- Commits citation updates back to repo

**Local permissions** (`.claude/settings.local.json`):
- Pre-approved: git log commands, WebFetch to support.claude.com, github.com

## Important Non-Obvious Patterns

1. **Alumni list is manual**: Changing role to `alumni` doesn't auto-update `team/index.md` alumni section (lines 92-125)

2. **Member pages persist after alumni**: Alumni members keep their individual pages; they're just filtered from the active team display

3. **Role transitions tracked separately**: Same person with multiple roles over time should have multiple roster entries (one per role period)

4. **Images must be square-ish**: Portrait component displays square crops; non-square images may look distorted

5. **Third person bios**: All member bios must be third person ("Jane is a PhD student...") except optionally PI intro

6. **Auto-cite commits**: The citation workflow commits directly to your repo; don't be surprised by auto-commits from GitHub Actions

## Template Documentation

For more detailed info on the underlying template system:
- [Basic Editing](https://github.com/greenelab/lab-website-template/wiki/Basic-Editing)
- [Components](https://github.com/greenelab/lab-website-template/wiki/Components)
- [Advanced Editing](https://github.com/greenelab/lab-website-template/wiki/Advanced-Editing)
