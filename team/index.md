---
title: Team
nav:
  order: 2
  tooltip: About our team
---

# <i class="fas fa-users"></i>Team

{% include section.html %}

{%
  include list.html
  data="members"
  component="portrait"
  filters="role: pi"
%}
{%
  include list.html
  data="members"
  component="portrait"
  filters="role: phd"
%}
{%
  include list.html
  data="members"
  component="portrait"
  filters="role: ra"
%}
{%
  include list.html
  data="members"
  component="portrait"
  filters="role: undergrad"
%}
{%
  include list.html
  data="members"
  component="portrait"
  filters="role: programmer"
%}
{:.center}


{%
  include link.html
  icon="fas fa-hands-helping"
  text="Join the Team"
  link="join"
  style="button"
%}
{:.center}


## Alumni

- 2021: Pranav Sankar (High School Intern)
