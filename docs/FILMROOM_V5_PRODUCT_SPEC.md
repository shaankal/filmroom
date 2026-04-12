# FILM ROOM V5

## League-first product spec

Prepared for: Shaan Kalgaonkar
Date: April 2, 2026
Status: Functional V5 product spec

---

## 1. Product Summary

Film Room V5 is a league-first football competition platform for fantasy leagues, creator communities, and high-engagement fan groups.

The product turns "knowing ball" into a recurring social game:

- groups create or join a Film Room league
- members play weekly football scenario sets
- users challenge each other head-to-head
- standings update across the NFL week
- Sunday live windows intensify competition

Film Room is not a general football app.

It is the competitive layer for football groups that already exist.

### Core value proposition

**Your group already debates football every week. Film Room turns that into a real game with rank, rivalry, and results.**

### Product thesis

The strongest unit of retention is not the individual fan.

It is the football group:

- fantasy league
- creator audience
- Discord community
- private group chat
- team fan community

The product should be designed first for group activation, group retention, and group identity.

---

## 2. Goals

### Primary product goal

Make Film Room the default weekly football competition ritual for dense fan groups.

### Business goals

- drive league-based activation
- maximize weekly active retention
- create repeat challenge behavior
- establish Sunday as a major engagement spike
- build monetization around premium competition features

### User goals

- prove they know more football than their friends
- win weekly group standings
- beat rivals head-to-head
- feel sharper while watching football
- belong to a football competition community

---

## 3. Target Users

### Primary target

Fantasy football leagues with active group chats, especially users ages 21-40.

### Secondary targets

- creator-led football communities
- football Discord groups
- team fan groups
- ex-player friend groups
- serious football fans who naturally invite others

### Best initial user profile

The commissioner or organizer:

- runs a fantasy league or football group
- enjoys managing weekly competition
- likes adding side games and stakes
- wants the group to have more to talk about than fantasy alone

This user is critical because they can activate an entire cluster.

### End user profile

A league member who:

- watches NFL regularly
- likes competing with friends
- wants to be seen as football-smart
- can commit to short weekly sessions
- cares about standings and bragging rights

---

## 4. Non-Goals

Film Room V5 is not trying to be:

- a coach tool
- a betting product
- a general sports media app
- a fantasy lineup management tool
- a broad public social network
- a full football education platform

These may create distraction, complexity, and category confusion.

---

## 5. Core Product Loop

### League-first loop

1. A user creates or joins a Film Room league
2. The league receives a weekly challenge slate
3. Members play short football scenarios and earn points
4. Members challenge rivals head-to-head
5. League standings update across the week
6. Sunday live windows create new chances to gain ground
7. Weekly results finalize and reset for the next NFL week

### Individual loop

1. Open Film Room
2. See league status, challenges, and current week progress
3. Play a challenge set or respond to a rival
4. Get scored immediately
5. Move in league standings
6. Share, rematch, or wait for the next game window

### Emotional loop

The product should consistently create:

- anticipation
- pressure
- pride
- embarrassment
- rivalry
- rematch energy

If users are merely "interested," the product is underperforming.

---

## 6. Product Architecture

Film Room V5 has five core product surfaces:

1. Home
2. Leagues
3. Play
4. Sunday Live
5. Profile

### Hierarchy

#### Primary

- Leagues
- Play

#### Secondary

- Sunday Live
- Home

#### Supporting

- Profile

The product should feel league-native, not dashboard-native.

---

## 7. Information Architecture

## Home

Home is the action hub.

It should answer:

- what matters right now
- where the user stands in their main league
- who challenged them
- what is live or upcoming

### Home modules

- Main league snapshot
- Weekly challenge card
- Incoming challenges
- Sunday live card
- Rivalry card
- Rank movement card
- Featured football moment card

### Home priorities

1. pending actions
2. league movement
3. time-sensitive play opportunities
4. status updates

## Leagues

Leagues are the center of identity and retention.

### League hub includes

- league name and branding
- members list
- weekly standings
- current week challenge progress
- league activity feed
- open rivalries
- commissioner tools
- invite flow
- weekly history

### League types

- Private Friend League
- Fantasy League Companion
- Creator League
- Community League
- Team Fan League

## Play

Play is where users complete scenario sets.

### Play modes

- Weekly Challenge
- Head-to-Head Challenge
- Daily Challenge
- Practice Mode
- Themed Packs

### Priority order

1. Weekly Challenge
2. Head-to-Head
3. Daily Challenge
4. Practice
5. Themed Packs

## Sunday Live

Sunday Live is the timed competition surface during active football windows.

### Sunday Live includes

- live challenge windows
- matchup-based challenge drops
- limited-time score multipliers
- league live standings
- live rivalry prompts

## Profile

Profile is football reputation.

### Profile includes

- Film Room score
- global percentile
- primary league standing
- weekly win-loss record
- head-to-head record
- challenge history
- rivalry history
- badges only if they represent real competition outcomes

---

## 8. User Roles

### Commissioner / Host

Primary responsibilities:

- create league
- invite members
- set league type
- choose privacy level
- optionally choose season format
- manage league settings

### Member

Primary responsibilities:

- join league
- play weekly challenge
- answer direct challenges
- compete on Sundays
- track standing and rivalries

### Creator Host

Additional capabilities:

- create public or semi-public audience league
- publish weekly creator challenge
- highlight results
- run premium competitions later

---

## 9. Onboarding

### New user onboarding goals

- get user into a group context fast
- communicate value in one sentence
- get first play session started within minutes
- encourage invite behavior early

### Default onboarding flow

1. Landing screen
2. Choose path:
  - Create a league
  - Join a league
  - Explore with demo challenge
3. Football identity setup:
  - username
  - favorite team
  - optional fantasy affiliation
4. League creation or join via code/link
5. Start first challenge
6. See first result and standing impact
7. Prompt invite or challenge send

### Commissioner onboarding

Must be especially streamlined:

- Create league name
- choose league type
- invite via share link or contacts
- start Week 1

### Success criteria

- user joins or creates a league in first session
- user completes first challenge set
- user sees league context before leaving

---

## 10. League System

The league system is the foundation of V5.

### League objects

Each league has:

- name
- type
- description
- invite mechanism
- roster
- standings
- season history
- commissioner
- weekly challenge state

### League settings

- private or public
- friend-only or open join
- member cap
- default scoring mode
- weekly reset timing
- tiebreaker rule

### Standings model

League standings should combine:

- weekly challenge score
- head-to-head wins
- Sunday live performance
- consistency bonus or streak bonus only if it drives real play

### League season rhythm

Each league operates on the NFL calendar:

- weekly slate opens
- members play before deadline
- Sunday live windows add score opportunities
- weekly standings lock
- weekly winner is crowned
- next week resets

### League social features

- activity feed
- challenge notifications
- result callouts
- upset alerts
- rivalry callouts

---

## 11. Core Game Modes

## 11.1 Weekly Challenge

This is the main recurring mode.

### Purpose

- create a shared weekly ritual
- give all league members a comparable task
- anchor standings

### Format

- 5-10 football scenarios per week
- consistent challenge structure
- short completion time, ideally 5-8 minutes

### Scoring inputs

- accuracy
- speed
- difficulty weighting

### Output

- weekly points
- explanation after each answer
- movement in standings

## 11.2 Head-to-Head Challenge

This is the main social loop.

### Purpose

- drive invites and rematches
- create direct rivalry
- add asynchronous multiplayer

### Format

- one user sends a challenge set to another user or league subgroup
- both users play same set
- higher score wins

### Head-to-head objects

- challenge status
- timer or response window
- score comparison
- rivalry record

## 11.3 Daily Challenge

This is support, not the company.

### Purpose

- lightweight habit support
- gentle re-entry during the week
- a low-friction play surface

### Format

- one short prompt or micro-set
- minimal time commitment

## 11.4 Practice Mode

Practice exists for depth, not primary retention.

### Purpose

- warm-up
- extra reps
- learning the game logic

### Warning

Practice should not overshadow league competition.

## 11.5 Themed Packs

Examples:

- rivalry week pack
- playoffs pack
- QB reads pack
- red zone pack
- featured game pack

These are useful for depth and monetization later.

---

## 12. Sunday Live

Sunday Live is the real-time competition layer.

### Purpose

- attach Film Room to live football ritual
- create urgency
- increase opens during game windows
- intensify league competition

### What Sunday Live is

- time-bound challenge windows during NFL Sundays
- matchup-based prompt sets
- league score opportunities linked to active game windows

### What Sunday Live is not

- live play-by-play dependency on every snap
- a sportsbook
- a fantasy scoring app
- a full stats dashboard

### Recommended first implementation

Use near-live windows, not true real-time snap sync.

Examples:

- 1 PM slate challenge drop
- featured 4 PM game challenge set
- Sunday Night Football live pack

This is easier to operate and still feels timely.

### Sunday Live mechanics

- challenge windows unlock at certain times
- users answer under time pressure
- scores count toward weekly league standings
- live leaderboard movement is visible
- limited-time rivalry prompts appear

### Why Sunday matters

- it aligns the app with existing user behavior
- it creates emotional energy
- it creates return reasons beyond static content
- it helps turn weekly competition into ritual

---

## 13. Scenario Design System

Scenario quality is existential.

### Scenario principles

Each scenario must be:

- clear
- fast
- fair
- football-legit
- easy to score
- fun to discuss after the answer

### Early scenario types

- defensive shell recognition
- leverage tell
- pressure identification
- likely best throw
- route concept recognition
- situational football logic

### Scenario structure

Each scenario includes:

- visual setup
- short context
- prompt
- answer choices
- correct answer
- explanation
- difficulty label

### Difficulty levels

- Casual Sharp
- Ball Knower
- Sunday Sicko

These are better than academic labels.

### Content pipeline

1. Concept library definition
2. Hand-authored base templates
3. Controlled variant generation
4. Human review
5. Release into weekly or themed packs

### Quality bar

If serious fans feel the football logic is arbitrary, trust collapses.

---

## 14. Scoring System

Scoring must be simple enough to understand and deep enough to matter.

### Core scoring formula

Base score consists of:

- correctness
- response speed
- scenario difficulty

### Suggested model

- correct answer: points awarded
- faster answer: modest bonus
- higher difficulty: multiplier
- incorrect answer: zero or small penalty depending on mode

### Weekly scoring

Weekly standings can include:

- Weekly Challenge points
- Sunday Live points
- head-to-head bonus wins

### Head-to-head scoring

- same scenario set
- same scoring system
- clear winner output

### Ranking design principles

- easy to understand
- stable enough to feel fair
- responsive enough to feel exciting
- no overly complex hidden formulas

---

## 15. Status and Identity

The status system is central to retention.

### Identity objects

- score
- rank tier
- league placement
- rivalry record
- weekly titles
- notable wins

### Rank tiers

Suggested public tiers:

- Prospect
- Starter
- Veteran
- Captain
- All-Pro
- Sunday Genius

### Weekly status outputs

- league winner
- biggest upset
- fastest sharp shooter
- rivalry winner

These are more meaningful than generic badges.

---

## 16. Notifications

Notifications should drive action, not spam.

### Critical notification types

- you were challenged
- your rival passed you
- Sunday Live is open
- weekly standings are about to lock
- your league week has reset
- you won or lost a matchup

### Notification principles

- urgency over volume
- social relevance over system noise
- push users toward a clear action

---

## 17. Monetization

Monetization should reinforce competition, not interrupt it.

### Free tier

- join one league
- access Weekly Challenge
- limited head-to-head sends
- limited Daily Challenge
- basic standings and profile

### Premium member tier

Suggested starting price:

- $8/month
- $60/year

Includes:

- unlimited head-to-head
- premium Sunday Live modes
- deeper rivalry history
- advanced stats
- extra themed packs
- multi-league participation

### Premium league / commissioner tier

Possible future monetization:

- custom league branding
- advanced league settings
- season archives
- private premium formats
- commissioner controls

### Creator monetization

Future layer:

- creator leagues
- audience competitions
- premium creator events
- sponsorship and branded contests

### Why this model works

It monetizes the social layer and competitive intensity, not just information.

---

## 18. Growth and Distribution

### Core GTM principle

Acquire groups, not isolated users.

### Best early channels

- fantasy league commissioners
- football creators and newsletters
- Discord communities
- private group chats
- team-specific fan communities

### Growth loops

#### Loop 1: League creation loop

1. user creates league
2. user invites friends
3. friends join to avoid exclusion
4. league becomes recurring social object

#### Loop 2: Head-to-head loop

1. user sends challenge
2. friend joins and responds
3. result gets discussed
4. rematch happens

#### Loop 3: Creator loop

1. creator launches league or weekly challenge
2. audience joins
3. competition creates engagement
4. creator repeats weekly

### Anti-patterns

Avoid relying on:

- paid UA before group retention exists
- broad public sharing
- passive social follows

---

## 19. Success Metrics

### Activation metrics

- % of users who create or join a league in first session
- time to first play
- first challenge completion rate

### Social metrics

- invites sent per league creator
- join conversion rate from invites
- head-to-head send rate
- rematch rate

### Retention metrics

- week-1 retention
- week-2 retention
- consecutive NFL week retention
- Sunday session penetration
- league survival rate across weeks

### Monetization metrics

- free-to-paid conversion
- paid conversion by role
- ARPU among retained users

### Qualitative metrics

- users describe app as competition, not quiz
- users mention rivalries and standings unprompted
- users bring friends in without prompting

---

## 20. MVP Scope For V5

If V5 were reduced to its strongest functional launch, ship:

- league creation and join flow
- one private league type
- Weekly Challenge
- head-to-head challenges
- standings
- profile with score and history
- simple Home action hub
- lightweight Sunday Live challenge windows

### Explicitly cut from V5 MVP

- public social feed
- advanced commissioner tools
- creator monetization
- complex content taxonomy
- too many scenario types
- full community discovery
- broad editorial content

The product should feel complete around group competition before expanding.

---

## 21. Risks

### Product risks

- scenarios feel too much like trivia
- league creation friction is too high
- users do not care enough about rank
- Sunday Live adds complexity without enough retention lift

### Market risks

- fantasy leagues prefer to keep all side activity in chat only
- creators may not convert audiences into repeated product behavior
- incumbents can copy obvious features

### Execution risks

- content production quality
- maintaining fairness in scoring
- balancing live relevance with operational simplicity

---

## 22. Open Questions

- What is the ideal weekly challenge length?
- Does commissioner-led setup materially improve retention?
- Which league type retains best: private friends, fantasy leagues, or creator audiences?
- How much does Sunday Live move retention versus weekly-only?
- Do users care more about league rank or direct rivalry?
- Which premium features drive actual payment?

These should be tested before overbuilding.

---

## 23. Product Roadmap

### Phase 1

Ship the core league competition loop:

- league creation
- weekly challenge
- standings
- head-to-head

### Phase 2

Add Sunday Live and stronger rivalry surfaces.

### Phase 3

Add creator leagues, advanced league identity, and premium competition formats.

### Phase 4

Expand into multi-league identity, team communities, and branded competition formats.

---

## 24. Final Product Definition

Film Room V5 is a league-first football competition platform built for fantasy leagues, creator communities, and obsessed fan groups.

Its job is simple:

turn weekly football talk into a structured game with standings, rivalry, and repeat behavior.

If Film Room wins, users will not think of it as a football content app.

They will think:

**"This is where our group settles who actually knows ball."**