---
name: "Biological motion capture"
summary: "Pose estimation, identity tracking and 3D: from video to how every animal in it moves."
goal: "Advance and validate the computational techniques and new technologies that measure how living things move, and build them into tools that scientists can rely on."
order: 1
media:
  - src: /media/sleap-flies.mp4
    poster: /media/sleap-flies.jpg
    width: 600
    height: 280
    alt: "Two fruit flies on a dark floor with their SLEAP-predicted skeletons overlaid; beside them, the same skeletons moving on their own."
    caption: "Two fruit flies tracked with SLEAP: the video with predicted poses, and the poses alone."
tools: [talmolab/sleap, talmolab/sleap-nn, talmolab/sleap-io, talmolab/dreem, talmolab/luc3d]
papers: [pereira-2022, pereira-2018, pereira-2020, luxem-2023, weinreb-2024, rose-2024, maree-2024, leonardis-2026, marks-2026]
---

We develop deep learning and computer vision methods for **motion capture of living
things**: finding the body parts of animals in ordinary video, following each
individual over time, and reconstructing how they move in 3D. This is how we
[quantify behavior](https://doi.org/10.1038/s41593-020-00734-z), and it is the
foundation for the rest of the lab's work.

A new algorithm or AI model is like a new measurement instrument: making sure it works
on new data is not trivial. Many systems make implicit assumptions about their data,
so they underperform on someone else's or, worse, *appear* to work while introducing
systematic biases that compromise the biology downstream. And a sound method still has
to be usable. It takes a tight feedback loop with the people who use a tool to make
sure it adds to their throughput rather than handing them the troubleshooting.

So we build our methods as open-source software, with the engineering and
[FAIR](https://www.go-fair.org/fair-principles/) practices that keep it maintainable,
reproducible and easy to use. We measure impact by what the tools let other scientists
do, as well as by publications.

### Pose estimation

[SLEAP](https://sleap.ai) is our flagship tool: an open-source framework for the
entire multi-animal pose tracking workflow, from labeling a few frames to training
models and tracking animals through video
([Nature Methods, 2022](https://doi.org/10.1038/s41592-022-01426-1)). It has been
developed and maintained in the lab since.

Making deep learning-based motion capture accessible has created an ecosystem that
builds on it. With the behavior quantification community, we set out best practices
for using this technology ([eLife, 2023](https://doi.org/10.7554/elife.79305)). We
have also contributed to methods downstream of pose tracking: unsupervised behavior
segmentation with
[Keypoint-MoSeq](https://doi.org/10.1038/s41592-024-02318-2), and imputation of
missing movement data with [DISK](https://doi.org/10.1038/s41592-025-02893-y).

### Identity tracking

Reliably linking each detection to the right individual over time is a hard, unsolved
problem. A landmark can be a few pixels off, but an identity switch is an all-or-none
error. [DREEM](https://dreem.sleap.ai) (DREEM Relates Every Entity's Motion) uses a
transformer to learn how to combine visual, spatial and temporal cues when deciding
who is who. It takes detections as keypoints, bounding boxes or segmentation masks,
and comes with pretrained models for both animals and microscopy.

### 3D pose

Some behavior cannot be resolved from a single view, social behavior most of all. We
are extending motion capture to 3D with multiple cameras, which for more than one
animal means working out which detection in each view belongs to which individual.
[LUC3D](https://talmolab.github.io/luc3d-docs) annotates poses across several cameras
at once, in the browser, and triangulates them into 3D
([bioRxiv, 2026](https://doi.org/10.64898/2026.11.17.767188)).

### Foundation models for pose

Today, pose tracking on a new setup starts with annotating data from scratch, because
annotations have not transferred between labs, or even between instruments. We are
working on models that learn from annotations pooled across labs, rigs and species, so
that tracking works on new data with little or no labeling. We see these models as a
core tool for agentic phenotyping, where a large language model calls on pose tracking
as needed to extract traits from diverse datasets.
