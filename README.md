# ASTRO -- Your Little Big Commander

## A lunar mission in your hands

ASTRO is an interactive educational game where children become commanders of a
lunar base. Across four mission days, players balance energy, oxygen,
radiation, food, and science while making the decisions that keep their crew
safe and their mission moving forward.

Designed for learners ages 7--12, ASTRO turns space science into an experience
of discovery. There is no single obvious answer: every decision creates a new
challenge, and every consequence helps players understand how a lunar base
works as a system.

ASTRO was created for the NASA Space Apps Challenge 2026 challenge
[Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/).

The challenge asks teams to turn the realities of operating a lunar or Martian
outpost into an interactive mission experience. ASTRO answers that challenge
by making life support, radiation protection, energy management, food
production, and scientific work part of one connected system.

## Play ASTRO

**[Launch the game at astro.edu.us](https://astro.edu.us)**

ASTRO runs directly in the browser and is designed for classroom sessions,
team activities, and independent play.

## Our challenge submission

ASTRO is the project submitted by the team
[Guardians of the Software Space Hawks](https://www.spaceappschallenge.org/2026/find-a-team/guardians-of-the-software-space-hawks/?tab=project).

- [Official challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)
- [Team submission](https://www.spaceappschallenge.org/2026/find-a-team/guardians-of-the-software-space-hawks/?tab=project)
- [ASTRO on GitHub](https://github.com/ibanezbot-dev/NSAC-ASTRO)

## The ASTRO experience

The player leads a four-person crew through simulated lunar days and nights.
Before committing to an action, they consider its trade-offs, predict what will
happen, and then watch the base and astronauts respond. A player may send
astronauts on a spacewalk, shelter the crew behind water shielding, invest
energy in the greenhouse, use medical countermeasures, or save power for a
later emergency.

The game is built around a simple loop:

1. Understand the mission situation.
2. Choose how to use limited resources.
3. Predict the consequence.
4. See the result and the cause-and-effect explanation.
5. Try a new strategy on the next playthrough.

This makes ASTRO more than a space-themed quiz. It is a visual, replayable
simulation where every choice has a cost and every consequence teaches
something about the lunar environment.

## Why ASTRO?

- **Learn by deciding:** players discover the relationship between resources
  through meaningful choices and immediate feedback.
- **Think like a mission planner:** energy, life support, radiation protection,
  greenhouse production, and exploration are connected.
- **Built for young explorers:** two age modes, guided play, voice narration,
  simple explanations, a glossary, keyboard support, and reduced-motion
  settings.
- **Science with a story:** a four-person crew, a lunar outpost, and a mission
  that makes the stakes easy to understand.
- **Ready to replay:** each strategy reveals different trade-offs and
  encourages players to try again.

ASTRO was designed to spark curiosity, empathy for the crew, and the feeling
of being a real commander. Its experience follows an inverted
**Mechanics--Dynamics--Aesthetics** approach: first define the feeling we want
players to have, then the prediction-and-discovery loop that creates it, and
finally the game rules that connect visual decisions to the simulation.

## NASA science and intelligent simulation

ASTRO brings real space-science context into an approachable game. Its design
draws on NASA's open resources, including
[DONKI](https://ccmc.gsfc.nasa.gov/DONKI/) for space-weather events and
[OSDR](https://science.nasa.gov/biological-physical/data/osdr/) for
space-biology research.

The project combines real NASA reference data with an embedded, lightweight
Random Forest model. The model translates solar storms, shielding levels, crew
activities, medical countermeasures, and greenhouse power into changes in
cellular damage, crew efficiency, and crop health. It was trained on 6,000
NASA-anchored scenarios and exported to plain JavaScript so the experience can
respond instantly on a school computer or tablet, without external APIs or
loading delays.

## Education and impact

ASTRO helps children connect space weather with real human survival on the
Moon. It is designed for ages 7--12 and supports learning through trial and
error rather than harsh game-over screens. Voice narration, a guided tutorial,
science definitions, keyboard navigation, and reduced-motion support make the
experience approachable for different learners.

The goal is to help children, teachers, and families ask better mission-planning
questions: What does this decision cost? What does it protect? What becomes
possible because of it?

## Project tools

- **Development:** HTML5, JavaScript, and Python.
- **Simulation:** scikit-learn, Random Forest, `m2cgen`, and NASA open data.
- **Design:** Balsamiq, Canva, whiteboarding, and Adobe Illustrator.
- **Research:** NASA resources, NASA APIs, and educational game-design research.
- **Hosting and collaboration:** GitHub and GoDaddy.

## Project resources

- [Technical report](documentation/technical_report.pdf)
- [Game Design Document](gdd/GDD.pdf)
- [Technical report source](documentation/technical_report.tex)
- [Game Design Document source](gdd/GDD.tex)
- [ML training notebook](ml/ml-training-code.ipynb)
- [Project presentation](https://canva.link/yuusyo08yvjo0jy)
- [GitHub repository](https://github.com/ibanezbot-dev/NSAC-ASTRO)

## Team ASTRO

- Santiago Navarro Pulido -- interface design and game mechanics
- Mitul Rebolledo Gallardo -- pitch and pedagogy research
- Ahmed Yamil García Ibáñez -- pitch, pedagogy research, prototype construction,
  and ML model training
- Lina Ayelén Salazar Rendón -- slide presentation, visual design, and data
  research
- German Uriel Marcial Carrasco -- slide presentation, data research, and
  documentation
- José Guillermo Hernández Calderón -- prototype construction, mentoring, and
  pitch

Created for the **NASA Space Apps Challenge 2026**:
**Build a Junior Astronaut Mission Trainer**.
