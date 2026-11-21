---
name: "Phenoinformatics"
summary: "Systems for phenotyping at scale, from home cages recorded around the clock to the roots of crop plants."
goal: "Develop and implement systems for large-scale phenotyping experiments."
order: 2
media:
  - src: /media/home-cage-cycles.mp4
    poster: /media/home-cage-cycles.jpg
    width: 1280
    height: 960
    alt: "An infrared video of three mice in a home cage, each with its SLEAP skeleton, tilts away while the animals' tracked trajectories pile up behind it along a time axis."
    caption: "Three mice tracked in their home cage, their trajectories stacked over time behind the video."
    plate: true
  - src: /media/root-sleap.mp4
    thread: plant-roots
    poster: /media/root-sleap.jpg
    width: 240
    height: 180
    alt: "A plant root growing down a white imaging plate, traced by SLEAP as a chain of coloured keypoints from its base to its tip."
    caption: "A growing root, traced from base to tip as a chain of keypoints."
    plate: true
tools: [talmolab/sleap-roots]
papers: [berrigan-2024, gall-2022, mitelut-2023, kiffer-2026, duporge-2025, cheng-2026, patel-2023, coley-2024, mills-2022, jia-2025]
---

Bioinformatics develops and applies computational methods to acquire, store and
analyze biological sequence data. **Phenoinformatics** does the same for phenotypes:
what an organism looks like and how it behaves. Unlike most sequence data, our primary
data are images, sampled continuously over long periods, and that sets our methods
apart from those of bioinformatics. We combine hardware, software and analysis to
scale SLEAP and other methods to high-throughput studies of phenotypic traits.

These pipelines also support collaborations in which behavioral analysis is one part
of a larger study, on questions from social isolation and alcohol drinking
([Patel et al., *Nature Neuroscience*, 2026](https://doi.org/10.1038/s41593-026-02413-x))
to cooperative behavior
([Cheng et al., *Nature*, 2026](https://doi.org/10.1038/s41586-026-10900-1)). Our goal for
the coming years is to build the analytical and informatics frameworks that mine these
large phenotypic datasets for biological insight.

### Home cage monitoring

Short behavioral assays miss what continuous recording catches. In developing gerbils,
monitoring families around the clock revealed structured social behavior well before
the animals become independent
([Mitelut et al., *PLoS Biology*, 2025](https://doi.org/10.1371/journal.pbio.3003348)).

With experimental labs at Salk, we have been scaling a home cage monitoring system for
longitudinal phenotyping of rodents. It records around the clock and uses
high-resolution pose tracking and downstream analysis to extract behavioral biomarkers
of aging and disease.

### Neurodegenerative disease

We are using home cage monitoring to map how behavior changes over the course of
disease in mouse models of ALS and Alzheimer's disease. Dense, longitudinal recording
is what makes it possible to detect the earliest signs of disease and to resolve
differences between individuals. Early behavioral biomarkers would support fast and
sensitive screening of candidate therapeutics, and what we learn about the mechanisms
of disease could carry over to diagnosis and intervention.

### Plant roots

With the Busch lab at Salk, we developed
[sleap-roots](https://github.com/talmolab/sleap-roots), a toolkit for extracting the
traits that characterize root system architecture in developing crop plants. It was
the first approach to use pose estimation for root phenotyping
([Berrigan et al., *Plant Phenomics*, 2024](https://doi.org/10.34133/plantphenomics.0175)).

This work is part of the Salk
[Harnessing Plants Initiative](https://www.salk.edu/harnessing-plants-initiative/),
which is looking for the genetic basis of traits that enhance carbon sequestration in
crop plants. With the Michael and Busch labs, we are developing
[Bloom](https://github.com/Salk-Harnessing-Plants-Initiative/bloom), a data lakehouse
that brings phenotypic and genetic data together so that both can be analyzed and
reused.

### Behavior in spaceflight

Supported by NASA Space Biology, we developed a system for phenotyping rodent behavior
in microgravity, and applied it to video of mice aboard the International Space
Station from the Rodent Research-1 mission
([Kiffer et al., *bioRxiv*, 2026](https://doi.org/10.64898/2026.04.30.721950)). Animal
models like these will inform the next generation of human space exploration
([Duporge et al., *npj Microgravity*, 2025](https://doi.org/10.1038/s41526-025-00460-5)).

### Human movement

We are extending these systems to human motor phenotyping, with the aim of clinically
relevant measures of movement in conditions such as autism, ALS and Alzheimer's
disease.
