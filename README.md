# Talmo Lab Website

**Live at:** https://talmolab.org


## Setup for local development

On Ubuntu/WSL, first install build tools and Ruby:

```
sudo apt update && sudo apt install build-essential && sudo apt install ruby-full
```

Next install Bundler:
```
sudo gem install bundler
```

Then just run `start.sh` in this folder or:

```
bundle exec jekyll serve --force_polling --livereload
```
([See this issue for livereloading on WSL.](https://github.com/microsoft/WSL/issues/216#issuecomment-756424551))


## Editing SVG logo

First, edit one of the existing variants:

- [`images/logo.svg`](images/logo.svg): Animated
- [`images/logo_static.svg`](images/logo_static.svg): Static, white stroke with transparent background
- [`images/logo_static_grey_bg.svg`](images/logo_static_grey_bg.svg): Static, white stroke with grey background (this looks the nicest for static)
- [`images/logo_static_outline.svg`](images/logo_static_outline.svg): Static, white stroke with thin black outline

Then, to render to PNG, use an online service. [This is a nice open-source one](https://github.com/vincerubinetti/svg-to-png).


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
