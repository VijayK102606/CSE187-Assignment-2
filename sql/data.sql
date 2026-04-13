-- This file is not included in the submission archive, anything you do here is just for manual "testing" via the Swagger UI --

----- Your insert statements go below here -----
DELETE FROM member;
DELETE FROM friend;
DELETE FROM post;
INSERT INTO member(data) 
VALUES (
  jsonb_build_object(
    'email', 'tenz@gmail.com'::text,
    'name', 'tenz'::text,
    'pwhash',crypt('tenz'::text, gen_salt('bf')),
    'roles', ARRAY['member'],
    'is_active', true
  )
)

INSERT INTO member(data) 
VALUES (
  jsonb_build_object(
    'email', 'aspas@gmail.com'::text,
    'name', 'aspas'::text,
    'pwhash',crypt('tenz'::text, gen_salt('bf')),
    'roles', ARRAY['member'],
    'is_active', true
  )
)

UPDATE member
set data->>'is_active' = 'false'
WHERE id = $1
RETURNING id, data->>'name' AS name;