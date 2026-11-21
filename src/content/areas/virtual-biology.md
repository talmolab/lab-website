---
name: "Virtual biology"
summary: "Computational models that emulate biological systems closely enough to run experiments in simulation."
goal: "Develop computational models that emulate biological systems faithfully enough to permit in silico experiments: ones that generate hypotheses we can test in the lab, and that are refined by the outcomes."
order: 3
media:
  - src: /media/mimic-mjx-species.mp4
    poster: /media/mimic-mjx-species.jpg
    width: 960
    height: 540
    alt: "Five animals in turn, each as video beside its MuJoCo body model, labelled first 'Registered trajectory' and then 'Kinematic replay': a rat in a green arena, a tethered fruit fly, a mouse forelimb reaching, a C. elegans worm and a stick insect."
    caption: "MIMIC-MJX: a rat, a fruit fly, a mouse forelimb, a worm and a stick insect, each beside its biomechanical model."
  - src: /media/mimic-mjx-arena.jpg
    thread: embodied-neuromechanics
    width: 1600
    height: 1114
    alt: "Rendered body models of a hooded rat, a fruit fly, a stick insect, a translucent green C. elegans worm and a mouse forelimb with red muscles, posed on a blue checkered arena against black."
    caption: "The five MIMIC-MJX body models, each posed from a frame of real motion."
tools: [talmolab/track-mjx, talmolab/stac-mjx]
papers: [zhang-2025, leonardis-2025, sirbu-2026, bian-2026b, haspel-2023, prasad-2022]
---

Bioinformatics aims to capture, store and process biological data at scale.
Computational biology develops mathematical and statistical models that reflect the
principles underlying biological processes. **Virtual biology** is a frontier field
that aims to *emulate* biology, with the explicit goal of simulating the experiments
that could be done in the lab while explaining all of the available data.

This has only become possible with AI and with modern methods for scalable numerical
simulation of physical processes. By aligning *in silico* experiments more closely
with *in vivo* ones, and by building tools that make them accessible to experimental
biologists, we believe discovery can be accelerated through hypotheses that are
computationally guided and informed by data. In time, this could be coupled with lab
automation for efficient high-throughput experimentation.

This is the most ambitious direction of our research program, and there is much left
to do to validate the approach.

### Embodied neuromechanics

[MIMIC-MJX](https://mimic-mjx.talmolab.org/) is a framework for building digital twins
that learn the neural computations required to imitate the body language of real
animals. Deep neural networks are trained to work like the brain: they observe what a
biological movement looks like, and are rewarded for producing the control signals
that drive a biomechanical body, through physics simulation, to move the way the real
animal did.

Building on work from Google DeepMind and our collaborators at Harvard, we generalized
the approach to work with any body model, adapted it to GPU-accelerated physics
simulators, and validated it across behaviors, species and levels of biomechanical
fidelity
([Zhang et al., *arXiv*, 2025](https://doi.org/10.48550/arxiv.2511.20532)). STAC-MJX
fits a body model to motion capture data, and track-mjx trains the control policies
that imitate it, for rodent, fruit fly, mouse arm, stick insect and worm models.

In a companion study, we trained neural control models to reproduce the movements of
mice performing a dexterous reaching task. Models that controlled muscle-based
actuators predicted recorded muscle activity better than models with less biologically
realistic torque actuators
([Leonardis et al., *NeurIPS Workshop*, 2025](https://doi.org/10.48550/arxiv.2511.21848)):
evidence that detailed biomechanics matter when modeling sensorimotor control.

### Sensorimotor control

We are using these models to ask how the nervous system controls movement. One
question is how vision guides the body during unconstrained, naturalistic behavior,
such as judging the distance across a gap before jumping it. Another, with the Azim
lab, is how movement copes with proprioceptive delays: we aim to build known and
hypothesized brainstem and spinal circuit architectures into our networks and probe
the effect of delayed feedback on dexterous behavior. A robotic research platform
gives us an embodied system in which to test the same control hypotheses, one where
sensorimotor delays can be set directly.

### Neural networks as models of brains

Our first step into *in silico* modeling asked how the visual diet of artificial
neural networks affects how well they predict biological ones. Networks trained on
images with more naturalistic statistics better predicted neural activity along the
ventral visual stream of mice shown the same stimuli
([Prasad et al., *NeurIPS Workshop*, 2022](https://openreview.net/forum?id=KIlSyKTulXO)).

### Genotype to phenotype

Using our plant data as a pilot, we aim to develop generative AI models that causally
link genotypic variation and gene expression with phenotypic outcomes. The scale and
natural variability of these datasets should let such models predict the consequences
of experimental perturbations such as genetic knockouts.
