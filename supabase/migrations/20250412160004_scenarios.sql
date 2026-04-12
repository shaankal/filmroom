-- Film Room V7 §03 — scenarios

CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_tag TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('casual_sharp', 'ball_knower', 'sunday_sicko')),
  context TEXT NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  coach_notes TEXT,
  visual_config JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'retired')),
  approved_by UUID REFERENCES users (id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
