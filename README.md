# Talmo Lab Website

**Live at:** https://talmolab.org


## Install (local development)

### Ubuntu / WSL

Install build tools and Ruby:

```
sudo apt update && sudo apt install build-essential && sudo apt install ruby-full
```

Install Bundler:
```
sudo gem install bundler
```

Install dependencies for this repo:
```
bundle install
```

### MacOS

Install Ruby:

```
brew install ruby && echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zprofile && source ~/.zprofile
```

Install Bundler:

```
gem install bundler
```

Install dependencies for this repo:
```
bundle install
```


## Local preview

Just run `start.sh` in this folder or:

```
bundle exec jekyll serve --force_polling --livereload
```
([See this issue for livereloading on WSL.](https://github.com/microsoft/WSL/issues/216#issuecomment-756424551))


## Claude Code Development

This repository includes custom skills for common tasks:

- **add-member**: Interactive guide for adding lab members with web research and bio drafting
- **lab-roster**: Generate comprehensive team rosters with role transitions and career tracking
- **local-test**: Test local Jekyll build and visualize pages with Playwright MCP

For local testing with Playwright:

```
claude mcp add playwright npx '@playwright/mcp@latest'
```

See `.claude/skills/` for detailed skill documentation.


## Documentation

[▶️ Get Started](https://github.com/greenelab/lab-website-template/wiki/Get-Started)

[🗚 Basic Formatting](https://github.com/greenelab/lab-website-template/wiki/Basic-Formatting)

[📝 Basic Editing](https://github.com/greenelab/lab-website-template/wiki/Basic-Editing)

[🤖 Automatic Citations](https://github.com/greenelab/lab-website-template/wiki/Automatic-Citations)

[⚙️ Advanced Editing](https://github.com/greenelab/lab-website-template/wiki/Advanced-Editing)

[🧱 Components](https://github.com/greenelab/lab-website-template/wiki/Components)

[🧠 Background Knowledge](https://github.com/greenelab/lab-website-template/wiki/Background-Knowledge)

[💡 Tips](https://github.com/greenelab/lab-website-template/wiki/Tips)

[❓ Support](https://github.com/greenelab/lab-website-template/wiki/Support)
