---
name: "Neuro-AI modeling"
summary: "Artificial neural networks as models of biological neural circuits, constrained by motion capture."
order: 3
media:
  - src: /media/nn-systems.png
    width: 616
    height: 289
    alt: "Diagram: sensory stimuli feed a network of subsystems built with topological priors (deterministic) and probabilistic priors (continuous and discrete), whose outputs are postural dynamics."
    caption: "Networks with topological and probabilistic priors, mapping sensory stimuli to postural dynamics."
    plate: true
tools: [talmolab/track-mjx, talmolab/stac-mjx]
papers: [zhang-2025, prasad-2022]
---

We are interested in exploring how artificial neural networks (**ANNs**) can be used as
**models of biological neural circuits**. To do this, we combine agent-based modeling
with imitation learning to take advantage of motion capture data to constrain our
models. This work aims to improve our understanding of both **brains** and **ANNs**.

[MIMIC-MJX](https://mimic-mjx.talmolab.org/) is the current form of this work.
STAC-MJX fits a physical body model to markerless tracking, and track-mjx trains
control policies to imitate the motion, for rodent, fruit fly, mouse arm, stick insect
and worm models
([Zhang, Yang et al., arXiv 2025](https://doi.org/10.48550/arxiv.2511.20532)).
