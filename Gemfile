source "https://rubygems.org"

# jekyll
# gem "jekyll"
gem "jekyll", "3.10.0"

# plugins
group :jekyll_plugins do
  gem "jekyll-redirect-from"
  gem "jekyll-feed"
  gem "jekyll-sitemap"
  gem "kramdown-parser-gfm"

  # other potentially useful plugins
  # gem "jekyll-github-metadata"
  # gem 'jekyll-avatar'
  # gem 'jekyll-gist'
  # gem 'jekyll-mentions'
  # gem 'jekyll-relative-links'
  # gem 'jemoji'
end

# Windows stuff
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem 'eventmachine', '1.2.7', git: 'git@github.com:eventmachine/eventmachine', tag: 'v1.2.7' if Gem.win_platform? # https://github.com/oneclick/rubyinstaller2/issues/96

# New (?) deps
gem "csv", "~> 3.3"
gem "base64", "~> 0.2.0"
gem "bigdecimal", "~> 3.1"
gem "webrick", "~> 1.7" # Needed since Ruby 3.x dropped built-in Webrick
