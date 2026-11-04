---
name: "Computational ethology"
summary: "Pose estimation and tracking: from video to the posture of every animal in it."
order: 1
media:
  - src: /media/sleap-flies.mp4
    poster: /media/sleap-flies.jpg
    width: 600
    height: 280
    alt: "Two fruit flies on a dark floor with their SLEAP-predicted skeletons overlaid; beside them, the same skeletons moving on their own."
    caption: "Two fruit flies tracked with SLEAP: the video with predicted poses, and the poses alone."
tools: [talmolab/sleap, talmolab/sleap-nn, talmolab/sleap-io, talmolab/dreem, talmolab/luc3d]
papers: [pereira-2022, pereira-2018, pereira-2020, weinreb-2024, maree-2024]
---

We develop methods for **pose estimation and tracking** to
[quantify animal behavior](https://talmopereira.com/publication/pereira-2020-review/pereira-2020-review.pdf).

To help others make use of this technology, we created [SLEAP](https://sleap.ai): an
open-source framework for the entire multi-animal pose tracking workflow.

The work has since grown in two directions. [DREEM](https://dreem.sleap.ai) links
detections into identities across a whole video rather than frame to frame, so many
animals can be followed for hours. [LUC3D](https://talmolab.github.io/luc3d-docs)
annotates poses across several cameras at once and triangulates them into 3D, for
social behavior a single view cannot resolve.
