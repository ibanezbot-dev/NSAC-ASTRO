# ASTRO - Your Little Big Commander
## Summary
ASTRO: "Your Little Big Commander" is an accessible, browser-based educational simulation game designed for K-12 learners (ages 7–12) to experience the real engineering and biological trade-offs of running a lunar outpost. Grounded in real NASA open datasets, space weather events from DONKI and space radiation biology from OSDR; ASTRO uses an embedded, lightweight Random Forest machine learning model compiled directly to JavaScript to simulate how solar storms, shielding levels, and crew decisions dynamically impact cellular radiation damage, crew efficiency, and greenhouse crop health in real time.
## Project Demonstration
https://canva.link/yuusyo08yvjo0jy
## Project
https://github.com/ibanezbot-dev/NSAC-ASTRO
## Project Details
### WHAT
Space games for kids often oversimplify survival or rely on walls of text. ASTRO turns real lunar mission challenges into simple, visual choices. Across simulated lunar days and nights, players decide how to spend limited energy and protect their crew. Before locking in an action, like going on a spacewalk, taking shelter behind water walls, or using medical treatments, players guess what will happen next and immediately see the results on their base and astronauts.

### HOW WE USED NASA DATA & MACHINE LEARNING 
We wanted the game to be scientifically accurate without needing an internet connection or heavy servers, so we built the simulation in two steps:

- Training the model: We combined historical solar storm records from NASA's DONKI database with radiation risk data from OSDR. Using Python, we trained a small Random Forest model (30 decision trees) to calculate how solar storms, shielding levels, crew activities, medical countermeasures, and greenhouse power impact astronaut health, work efficiency, and crop growth.
- Running it in the browser: We converted those trained decision trees directly into plain JavaScript. This lets the game calculate realistic outcomes instantly on any school computer or tablet without external APIs or loading delays.
### BENEFITS & ACCESSIBILITY
Real trade-offs: Every choice has a cost. Saving power today might leave the crew exposed to a solar storm tomorrow.
Made for kids (ages 7 to 12): We designed the game around curiosity and replayability so kids learn through trial and error rather than harsh game-over screens.
Accessible for everyone: Includes simple pop-up definitions for science words, built-in voice narration, a guided tutorial, keyboard navigation, and reduced-motion settings.
### IMPACT
ASTRO helps kids connect space weather with real human survival on the Moon. By pairing real NASA science with an approachable game, it encourages students, teachers, and parents to think like mission planners.

### TOOLS
- Develop: HTML5, JavaScript, Python, Claude.
- Design: Balsamiq, Canva, Whiteboard, Adobe Illustrator.
- Investigation: Google Academic, NASA resources, NASA API's.
- Hosting: GitHub, GoDaddy.
- Extra: Google Docs, OneDrive, Google Cloud.
### CREATIVE
When we started brainstorming, we asked ourselves a simple question: how do we make space radiation and life support fun for a 9-year-old without dumbing down the science?

Many educational games give kids simplified, watered-down choices where one answer is obviously "good" and the other is "bad." We decided to go the opposite direction. Kids love strategy and real responsibility when they can see how things work. Instead of hiding the complexity of a lunar base, we turned it into clear cause-and-effect puzzles.

To design the experience, we used an inverted MDA framework (Mechanics, Dynamics, Aesthetics):

- Aesthetics (How it should feel): We started with the emotion we wanted to spark: curiosity, empathy for the crew, and the excitement of being a real commander. We wanted kids to feel like they were in charge, not taking a school quiz.
- Dynamics (How players interact): We built a loop of prediction and discovery. Before committing to a choice, the player guesses what will happen. When a solar storm hits, they immediately see how their preparation paid off or where the base struggled, encouraging them to replay and test new strategies.
- Mechanics (The rules behind the scenes): Finally, we connected those visual choices to our NASA-trained model. Moving energy to the greenhouse, reinforcing water shielding, or sending astronauts on a spacewalk directly changes the numbers under the hood.
Visually, we kept the interface clean, colorful, and low on text. Every icon, meter, and sound effect is there to help young players read the state of their base at a glance, turning real space engineering into an intuitive adventure.

ASTRO is the combination between Real Data, Education, Curiosity Fun and Engagement.

[VideoGame Link](https://astro.edu.us)

## Use of Super Intelligence (SI)
Research or Information Gathering  
Building SI/ML Into the Project
## NASA Data
[DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)  
[OSDR](https://science.nasa.gov/biological-physical/data/osdr/)
## Space Agency Partner & Other Data
[Videogames Genres](https://repositorio.unraf.edu.ar/items/c4294fad-5890-4eda-9de5-9754926a779d)  
[Videogames Design Model](https://ludology.usek.cl/wp-content/uploads/2019/09/LUDOLOGYN1-2019-77-82.pdf)  
[Game Design Course](https://gamedesignla.com/game-design/)  
[K-12 Game on Competition Page](https://www.k12.com/k12-community/meet-the-winners-of-the-2024-k12-game-on-competition/)  
[Educational Game Design](https://ieeexplore.ieee.org/document/7516346)  
[Games STEM education](https://cadrek12.org/spotlight/games-stem-education)  
[Thinking Skills](https://www.researchgate.net/publication/229570529_System_thinking_skills_at_the_elementary_school)  
[Understanding of complex systems](https://www.researchgate.net/publication/230726725_Fish_swim_rocks_sit_and_lungs_breathe_Expert-novice_understanding_of_complex_systems_and_designs_for_learning)  
[Design, Digital Games, Educational](https://www.researchgate.net/publication/277630332_Digital_Games_Design_and_Learning_A_Systematic_Review_and_Meta-Analysis)
