-- Film Room Day 8 dev seed
-- Idempotent seed for five approved scenarios + one weekly scenario set
-- plus an open weekly challenge for each existing league.

INSERT INTO scenarios (
  id,
  concept_tag,
  difficulty,
  context,
  prompt,
  choices,
  correct_answer,
  explanation,
  coach_notes,
  status,
  approved_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'shell-recognition',
    'casual_sharp',
    '3rd-and-6 on the left hash. Two-high shell before the snap, nickel corner pressed with outside leverage.',
    'What coverage family is the defense most likely presenting?',
    '[{"key":"A","text":"Cover 2"},{"key":"B","text":"Cover 3"},{"key":"C","text":"Cover 1 man"},{"key":"D","text":"Zero blitz"}]'::jsonb,
    'A',
    'The two-high shell with the corner squatting outside suggests a Cover 2 look. The pressed outside leverage is baiting the throw to the hole shot.',
    'Use this as an easy opener to teach shell recognition.',
    'approved',
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'leverage-tell',
    'ball_knower',
    '2nd-and-8 in the high red zone. Boundary corner is inside and soft, safety tilted over the top.',
    'Against this leverage, where is the best throw most likely to be?',
    '[{"key":"A","text":"Boundary go ball"},{"key":"B","text":"Back-shoulder fade"},{"key":"C","text":"Quick out away from leverage"},{"key":"D","text":"Middle glance route"}]'::jsonb,
    'C',
    'The corner is protecting inside leverage with top help. The clean answer is to win away from leverage on the quick out before the corner can drive downhill.',
    'This should feel like a football reasoning problem, not a memory test.',
    'approved',
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'pressure-id',
    'ball_knower',
    '3rd-and-5. Will linebacker walked up in the B-gap, nickel cheating from the field, single high safety in the middle.',
    'What is the most important pre-snap alert for the quarterback here?',
    '[{"key":"A","text":"Expect Tampa 2 dropper"},{"key":"B","text":"Prepare for field-side pressure"},{"key":"C","text":"Check to outside zone"},{"key":"D","text":"Throw the fade immediately"}]'::jsonb,
    'B',
    'The nickel and Will alignment create a strong pressure tell to the field side. The QB has to account for hot answers and protection first.',
    'Use as an intro to pressure identification without making the picture too busy.',
    'approved',
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'read-progression',
    'sunday_sicko',
    '1st-and-10, trips right. Defense rotates late from two-high to middle-field closed with the weak hook defender expanding under No. 2.',
    'Given the rotation, what is the best progression answer?',
    '[{"key":"A","text":"Force the glance to No. 1"},{"key":"B","text":"Work the flat quickly"},{"key":"C","text":"Hit the seam behind the hook expansion"},{"key":"D","text":"Scramble immediately"}]'::jsonb,
    'C',
    'The late rotation opens space behind the expanding weak hook defender. The seam becomes the best answer if the QB sees the rotation on time.',
    'Higher-difficulty item for sharper users.',
    'approved',
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'situational-logic',
    'casual_sharp',
    '4th-and-2 at midfield late in the half. Defense shows a light box and off coverage with both safeties deep.',
    'What is the smartest situational answer before the snap?',
    '[{"key":"A","text":"Take the shot deep"},{"key":"B","text":"Attack the easy underneath conversion"},{"key":"C","text":"Burn a timeout and punt"},{"key":"D","text":"Check to max protect"}]'::jsonb,
    'B',
    'The defense is conceding the underneath access throw. On 4th-and-2, the smartest answer is to take the efficient conversion.',
    'Keep the situation intuitive for fan players.',
    'approved',
    now()
  )
ON CONFLICT (id) DO UPDATE
SET
  concept_tag = EXCLUDED.concept_tag,
  difficulty = EXCLUDED.difficulty,
  context = EXCLUDED.context,
  prompt = EXCLUDED.prompt,
  choices = EXCLUDED.choices,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation,
  coach_notes = EXCLUDED.coach_notes,
  status = EXCLUDED.status,
  approved_at = EXCLUDED.approved_at;

INSERT INTO scenario_sets (
  id,
  name,
  set_type,
  scenario_ids,
  nfl_week,
  season_year
)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'Dev Weekly Seed Set',
  'weekly',
  ARRAY[
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid
  ],
  1,
  EXTRACT(YEAR FROM now())::int
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  set_type = EXCLUDED.set_type,
  scenario_ids = EXCLUDED.scenario_ids,
  nfl_week = EXCLUDED.nfl_week,
  season_year = EXCLUDED.season_year;

INSERT INTO weekly_challenges (
  league_id,
  week_number,
  season_year,
  scenario_set_id,
  opens_at,
  locks_at,
  status
)
SELECT
  l.id,
  l.current_week,
  l.season_year,
  '66666666-6666-6666-6666-666666666666'::uuid,
  now() - interval '1 day',
  now() + interval '6 days',
  'open'
FROM leagues l
ON CONFLICT (league_id, week_number, season_year) DO UPDATE
SET
  scenario_set_id = EXCLUDED.scenario_set_id,
  opens_at = EXCLUDED.opens_at,
  locks_at = EXCLUDED.locks_at,
  status = EXCLUDED.status;
