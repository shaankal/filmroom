# FILM ROOM V6
## Updated product and company spec after investor critique

Prepared for: Shaan Kalgaonkar
Date: April 2, 2026
Status: V6 post-feedback revision

---

## 1. Executive Positioning

Film Room is a league-first football competition platform for fantasy leagues, creator communities, and high-engagement fan groups.

The product does one thing:

**it turns weekly football talk into a structured competition with standings, rivalry, and repeat behavior.**

V6 keeps the core V5 insight:

- the group is the unit of retention
- the commissioner or host is the unit of activation
- rivalry is the emotional engine

But V6 changes the company in five important ways:

1. content quality is now treated as the product, not a supporting system
2. monetization shifts from individual subscription-first to league-level pricing
3. creator leagues move from expansion to the core go-to-market
4. retention design now includes dead-league recovery and bottom-of-standings engagement
5. offseason engagement is built into the roadmap from the start

---

## 2. What Was Valid In The Critique

The critique was correct on the most important points:

- content quality is existential
- daily challenge is not the core behavior
- practice mode weakens the product identity
- commissioner economics matter more than individual-user pricing
- creator-led distribution is more attractive than it was weighted in V5
- league churn and offseason churn were under-addressed

V6 is designed to fix those weaknesses directly.

---

## 3. Core Company Thesis

Film Room should not be built as:

- a football trivia app
- a generic sports companion
- a solo learning product
- a subscription product for isolated fans

Film Room should be built as:

**the football competition layer for fantasy leagues and football communities.**

The first successful version of the company is not "an app fans download."

It is:

- a league a commissioner starts
- a creator competition an audience joins
- a group ritual that recurs every NFL week

That makes the company structurally stronger on activation, retention, and monetization.

---

## 4. Primary Target User

### Primary customer

Fantasy league commissioners and creator hosts.

These are the users most likely to:

- start a Film Room league
- invite others
- pay for a better experience
- enforce participation
- create recurring weekly energy

### Primary end user

Fantasy league members and creator-community members ages 21-40 who:

- already watch NFL weekly
- participate in active football group chats
- care about status and rivalry
- are willing to spend 5-10 minutes per week in a side competition

### Secondary targets

- team fan communities
- private friend groups
- football Discords
- ex-player circles

V6 is no longer framed as "all high-engagement fans."

It is framed as:

**high-engagement football groups with an organizer.**

---

## 5. Product Definition

### One-sentence definition

Film Room is a weekly football competition platform where leagues and communities play curated football scenarios, challenge rivals, and climb standings across the NFL week.

### Core loop

1. commissioner or creator starts a Film Room league
2. members join through invite link or community entry
3. the group receives the weekly challenge set
4. members compete for league points and head-to-head wins
5. Sunday Live creates time-bound opportunities to change standings
6. weekly results finalize, callouts are generated, and the next week resets

### Emotional promise

Film Room should feel like:

- a legitimate test
- a rivalry engine
- a weekly ritual
- a reason to talk more trash

If it feels like a polished quiz app, it fails.

---

## 6. What Ships And What Gets Cut

### Core V6 product surfaces

- League Hub
- Weekly Challenge
- Head-to-Head
- Sunday Live
- Profile

### Deprioritized or removed from core

- Daily Challenge
- Practice Mode
- generic badge systems
- broad public social feed
- content-heavy editorial surfaces

### Why

These surfaces diluted the league-first thesis and pulled the product back toward trivia or education.

The product must be brutally centered on the league competition loop.

---

## 7. The Product Architecture

## 7.1 League Hub

The League Hub is the center of the product.

It includes:

- league standings
- current week progress
- pending head-to-head challenges
- rivalry board
- recent results
- commissioner tools
- weekly reset banner
- invite flow

### League types at launch

- Private Fantasy League
- Creator League

That is enough.

Do not over-expand league types at the start.

## 7.2 Weekly Challenge

This is the main shared competition object.

### Purpose

- create a single comparable weekly experience
- anchor standings
- provide legitimacy to the league

### Format

- 5-7 scenarios
- 5-8 minutes total
- consistent structure every week
- one lock time for league scoring

### Key rule

If users cannot explain why this week mattered, the product is too abstract.

## 7.3 Head-to-Head

This is the strongest social mechanic.

### Purpose

- create direct rivalry
- drive challenge loops
- create obligations inside the group

### Launch scope

- asynchronous challenge sends
- fixed challenge set
- clear winner output
- rivalry record

This should be treated as a primary growth and retention engine, not a side mode.

## 7.4 Sunday Live

Sunday Live remains critical, but V6 simplifies it.

### Launch approach

Use two timed windows:

- early slate window
- primetime window

That is enough to test whether Sunday meaningfully changes engagement.

### Sunday Live mechanics

- each window unlocks a limited challenge pack
- scores count toward the weekly league table
- live rank movement is visible
- a short timer keeps tension high

### Explicit constraint

No snap-by-snap dependency at launch.

Operational reliability matters more than theoretical realism.

## 7.5 Profile

Profile is secondary.

It should include:

- global score
- current league placement
- rivalry record
- season history
- notable wins

Do not overbuild stats pages early.

---

## 8. Content Is The Product

This is the biggest V6 change.

The scenario system is no longer treated like a backend pipeline.

It is the core product asset.

### V6 content thesis

Film Room only works if players believe the scenarios are:

- football-legit
- fair
- interesting
- non-trivial
- worth debating

### Content team requirement

Before meaningful product scale, Film Room needs a football content lead with real credibility.

Ideal profile:

- ex-coach
- ex-scout
- respected football analyst
- strong football educator with audience trust

This person owns:

- concept quality
- scenario review
- explanation voice
- difficulty design
- trust bar

### Content production model

V6 uses a three-layer content system:

#### Layer 1: Editorial core

Hand-authored canonical scenarios designed by the content team.

#### Layer 2: Controlled variants

Bounded variants generated from canonical scenarios using structured templates and AI assistance.

#### Layer 3: Competition packaging

Weekly sets, creator sets, rivalry sets, and offseason packs assembled from the approved library.

### Scenario validity rule

Scenarios should avoid the worst of both worlds:

- not raw historical replay trivia
- not unconstrained synthetic football fiction

The preferred format is:

**football-plausible, structured scenarios derived from real concepts but packaged for competitive play.**

### Quality-control process

1. content lead defines concept list
2. scenario writer creates base item
3. reviewer validates football logic
4. product review checks clarity and fairness
5. item enters approved library
6. only then can controlled variants be generated

### Minimum content bar before launch

- 100 reviewed scenarios in the approved library
- multiple difficulty bands
- a full season plan for weekly distribution

Without this, the product should not launch publicly.

---

## 9. Validity Problem: How Film Room Avoids Becoming Trivia

This needed a direct answer.

### The danger

If scenarios are obviously sourced from memorable historical plays, users are rewarded for memory, not football reasoning.

If scenarios are synthetic without credibility, users reject the answer key.

### V6 solution

Film Room scores football reasoning through structured concept prompts:

- shell recognition
- leverage reads
- situational decision logic
- pressure identification
- best-throw logic
- concept diagnosis

The correct answer must be defensible, not magical.

### Design principles

- prompts should test recognition and reasoning, not highlight memory
- explanations should show why the answer is best, not merely reveal the answer
- wrong answers should be plausible enough to create tension
- users should feel "I should have seen that," not "that was arbitrary"

This is how the product earns legitimacy.

---

## 10. League Lifecycle And Churn Recovery

V6 adds explicit mechanisms for league decay.

### The problem

Most groups lose energy over time.

If Film Room has no recovery loop, Week 4-8 becomes the death zone.

### Recovery mechanics

#### 1. Weekly reset framing

Each NFL week should feel like a fresh competition opportunity, not only cumulative season grind.

#### 2. Weekly winner callouts

Users can still win the week even if they are losing the season.

#### 3. Rivalry side quests

Direct matchups create parallel reasons to return beyond the main table.

#### 4. Last-place comeback incentives

Underdog bonus or comeback awards can keep lower-ranked users engaged.

#### 5. Commissioner reactivation tools

The commissioner gets:

- one-tap nudge messages
- recap cards for the group chat
- "week is about to lock" prompts
- weekly winner share cards

### League health states

Every league should be internally classified as:

- healthy
- slipping
- at risk
- dormant

This lets the product trigger different recovery prompts and host nudges.

---

## 11. Offseason Strategy

This was missing in V5 and it matters.

If Film Room disappears from April through August, the product becomes a re-acquisition treadmill.

### V6 offseason plan

The offseason is not dead time.

It becomes a different competition season.

### Offseason content surfaces

- Draft Prep mode
- historical game packs
- playoff rewind packs
- college football expansion packs
- team-specific offseason trivia only if it still feels competitive

### Offseason goals

- retain the top 20-30% of power users
- preserve group identity
- keep creator leagues warm
- reduce reacquisition burden before NFL season

### Product principle

The offseason product should still feel like competition, not archive browsing.

---

## 12. Monetization Changes

V6 changes monetization materially.

### Primary monetization unit

The league, not the individual user.

### Launch monetization

#### League Pass

Recommended test:

- $30-50 per season per league

Purchased by:

- commissioner
- league host
- creator

League Pass includes:

- premium league setup
- full season standings history
- Sunday Live access
- advanced rivalry features
- custom league identity
- better commissioner tools

### Secondary monetization

#### Individual premium

This becomes secondary and optional, not the first economic assumption.

Possible use cases:

- multi-league access
- premium profile history
- extra creator events

### Why this is better

- aligns payment with the organizer
- reduces free-rider tension
- matches how small-group recreational products are often purchased

### Creator monetization

This moves up in importance.

Potential creator monetization:

- paid creator leagues
- branded competitions
- premium audience tournaments

This is a higher-ceiling business line than pure individual subscriptions.

---

## 13. Go-To-Market Changes

V6 puts creators much earlier in the strategy.

### Priority acquisition channels

1. fantasy league commissioners
2. football creators with engaged audiences
3. football Discord communities

### Creator strategy

Creator leagues are now a V1 wedge, not a Phase 3 add-on.

Why:

- creators already organize audience identity
- creators provide trust and top-of-funnel
- creators can make weekly competition feel alive
- one successful creator league can outperform thousands of cold installs

### Initial creator target

Not the biggest creators.

The right targets are:

- mid-sized football creators
- strong audience engagement
- active Discord or newsletter presence
- willingness to co-design the competition

### White-glove creator program

At launch, Film Room should manually support a handful of creators with:

- onboarding help
- co-branded league setup
- weekly challenge packaging
- recap assets

This is a better early growth bet than broad consumer launch.

---

## 14. Metrics That Actually Matter

V6 shifts metric emphasis from generic retention toward league survival and host success.

### Critical activation metrics

- % of commissioners who create league and send invites
- invite acceptance rate
- % of joined users who complete Week 1 challenge

### Critical league metrics

- league activation rate
- league Week 3 survival
- league Week 5 survival
- average active members per league

### Critical retention metrics

- W2 retention by league cohort
- W4 retention by league cohort
- Sunday participation rate
- head-to-head rematch rate

### Critical monetization metrics

- League Pass conversion
- creator league monetization rate
- revenue per active league

### Critical quality metrics

- % of scenarios rated fair/legit
- trust score from active users
- % of users describing the product as "competition" versus "quiz"

### Pre-seed proof bar

The company becomes much more fundable if it can show:

- 10+ real active leagues still alive by Week 5
- 50%+ week-over-week league retention in the strongest cohort
- strong commissioner invite behavior
- one creator-led league with real repeat participation
- clear positive scenario trust scores

This is a much more honest proof bar than pure download counts.

---

## 15. MVP Scope For V6

### Must ship

- Private Fantasy League
- Creator League
- League creation and invite flow
- Weekly Challenge
- Head-to-Head
- two-window Sunday Live
- league standings
- commissioner recap and nudge tools
- basic Profile
- League Pass payment test

### Must not ship

- Daily Challenge
- Practice Mode
- public feed
- complex achievement system
- multi-league depth
- too many content formats

### Why

The V6 MVP should test:

- can hosts activate a league
- can the league survive several weeks
- do scenarios feel legitimate
- does Sunday improve retention
- will a host pay

That is enough.

---

## 16. Main Risks That Still Remain

Even after these changes, the business still has serious risks.

### 1. Content cost and complexity

A quality scenario pipeline is expensive and operationally demanding.

### 2. League activation friction

Commissioners may still hesitate to ask their group to adopt a new tool.

### 3. Mid-season fatigue

Even with recovery mechanics, some leagues will die.

### 4. Seasonality

The offseason plan may not work as well as hoped.

### 5. Competitive pressure

Sleeper, ESPN, or a creator tool stack could still clone parts of the concept.

V6 is stronger, but it is still an execution-heavy company.

---

## 17. Fundraising Story

The best investor story is now:

**Film Room is building the football competition layer for fantasy leagues and creator communities.**

We are not targeting all fans.

We are starting with dense football groups that already have:

- social structure
- recurring weekly behavior
- competition
- an organizer

The product gives those groups a new ritual:

- a weekly challenge
- direct rivalry
- timed Sunday competition
- standings that matter

The wedge is strong because the group, not the individual, drives retention.

The business is stronger because:

- hosts can pay at the league level
- creators can become distribution partners
- the content system creates legitimacy

That is a more credible venture story than a broad fan app.

---

## 18. Final Call

V6 is the strongest version of Film Room so far.

It is more honest about the real problems:

- content legitimacy
- commissioner activation
- group monetization
- seasonal churn

And it responds to them directly.

Film Room is still not guaranteed to be a venture outcome.

But V6 is finally built around the right economic and behavioral unit:

**the football group with a host who cares enough to run the game.**

If Film Room can prove:

- hosts invite consistently
- leagues survive through Week 5+
- content earns trust
- creator-led groups work

then it becomes a serious fundable company.
