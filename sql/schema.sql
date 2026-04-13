-- Do not delete this table
DROP TABLE IF EXISTS member CASCADE;
DROP TABLE IF EXISTS member CASCADE;
DROP TABLE IF EXISTS post CASCADE;
DROP TABLE IF EXISTS friend CASCADE;

-- Your schema DDL (create table statements etc.) goes below here 
CREATE TABLE member(
  id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb
);

CREATE TABLE post(
  id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
  member UUID REFERENCES member(id) ON DELETE CASCADE,
  data jsonb
);

CREATE TABLE friend (
  sender UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  receiver UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  PRIMARY KEY (sender, receiver),
  data jsonb
);
