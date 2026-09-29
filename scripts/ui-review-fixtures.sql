BEGIN;
DO $$ BEGIN
  IF current_database() <> 'ui_review' THEN
    RAISE EXCEPTION 'Visual fixtures must only be loaded into the isolated ui_review database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE email='ui-review@example.test') THEN
    RAISE EXCEPTION 'Create the isolated super-admin test account ui-review@example.test first';
  END IF;
END $$;
-- This script is run ONLY in holloway-ui-review-db. Disable copied endpoints.
UPDATE webhooks SET is_active=false;
INSERT INTO app_users(id,email,encrypted_password,raw_user_meta_data)
SELECT v.id::uuid,v.email,u.encrypted_password,'{}'::jsonb FROM app_users u CROSS JOIN (VALUES
('10000000-0000-0000-0000-000000000001','ui-member@example.test'),
('10000000-0000-0000-0000-000000000002','ui-observer@example.test'),
('10000000-0000-0000-0000-000000000003','ui-external@example.test'))v(id,email)
WHERE u.email='ui-review@example.test' ON CONFLICT DO NOTHING;
INSERT INTO user_profiles(id,display_name,is_super_admin) VALUES
('10000000-0000-0000-0000-000000000001','Review member',false),
('10000000-0000-0000-0000-000000000002','Review observer',false),
('10000000-0000-0000-0000-000000000003','Review external',false) ON CONFLICT DO NOTHING;
INSERT INTO agents(id,name,display_name,owner,owner_user_id,trust_tier) VALUES
('20000000-0000-0000-0000-000000000001','review-proposer','Review proposer','UI Review','10000000-0000-0000-0000-000000000001','internal'),
('20000000-0000-0000-0000-000000000002','review-observer','Review observer','UI Review','10000000-0000-0000-0000-000000000002','partner'),
('20000000-0000-0000-0000-000000000003','review-external','Review external','UI Review','10000000-0000-0000-0000-000000000003','external'),
('20000000-0000-0000-0000-000000000004','review-peer','Review peer','UI Review','10000000-0000-0000-0000-000000000001','internal') ON CONFLICT DO NOTHING;
INSERT INTO contracts(id,title,description,status,proposer_id,max_turns,current_turns,expires_at,unlinked_reason)
SELECT ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,title,
E'## Review brief\n\nAudit this release and report your findings with evidence. The operator needs a clear decision, a readable original brief, and the full conversation.\n\n### Scope\n\n- Check the runtime across multiple instances.\n- Preserve permissions and status semantics.\n- Inspect long identifiers and detailed Markdown.\n\n'||repeat(E'Keep the findings precise and explain the next action. This paragraph exercises long, authored content across narrow and wide viewports.\n\n',12),
status,'20000000-0000-0000-0000-000000000001',100,0,now()+interval '7 days','Visual review fixture'
FROM (VALUES(1,'Review fixture · waiting for the opening agent','active'),(2,'Review fixture · blocked on a human answer','active'),(3,'Review fixture · approval required','active'),(4,'Review fixture · accepted completion','closed'),(5,'Review fixture · closed without acceptance','closed'),(6,'Review fixture · expired conversation','expired'),(7,'Review fixture · long conversation','active'),(8,'Review fixture · pending invitation','proposed'))v(n,title,status) ON CONFLICT DO NOTHING;
INSERT INTO contract_participants(contract_id,agent_id,role,status,responded_at)
SELECT c.id,a.id,a.role,CASE WHEN c.id::text LIKE '%000000000008' AND a.role='invitee' THEN 'pending' ELSE 'accepted' END,now()
FROM contracts c CROSS JOIN (VALUES('20000000-0000-0000-0000-000000000001'::uuid,'proposer'),('20000000-0000-0000-0000-000000000004'::uuid,'invitee'),('20000000-0000-0000-0000-000000000002'::uuid,'observer'))a(id,role)
WHERE c.id::text LIKE '30000000-%' ON CONFLICT DO NOTHING;
INSERT INTO contract_questions(id,contract_id,asked_by_agent_id,kind,blocking,body,status)VALUES
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004','blocked',true,E'## Decision needed\n\nCan the release proceed after the audit, or should the agent wait for a follow-up fix?\n\nThe agent has stopped until you answer.','open') ON CONFLICT DO NOTHING;
UPDATE contracts SET max_turns=3,current_turns=3,completion_requires_approval=true WHERE id='30000000-0000-0000-0000-000000000003';
UPDATE contracts SET closed_at=now(),closed_by='system:completion-approved',closed_by_kind='system',completion_requires_approval=true,completion_approved_at=now(),completion_approved_by='20000000-0000-0000-0000-000000000001' WHERE id='30000000-0000-0000-0000-000000000004';
UPDATE contracts SET closed_at=now(),closed_by='Review proposer',closed_by_kind='agent',closed_without_approval=true,completion_requires_approval=true WHERE id='30000000-0000-0000-0000-000000000005';
UPDATE contracts SET expires_at=now()-interval '1 day',closed_at=now(),closed_by='system:expiry',closed_by_kind='system' WHERE id='30000000-0000-0000-0000-000000000006';
DELETE FROM messages WHERE contract_id='30000000-0000-0000-0000-000000000007';
INSERT INTO messages(contract_id,sender_id,message_type,content,turn_number,consumes_turn,requires_action,created_at)
SELECT '30000000-0000-0000-0000-000000000007',CASE WHEN n%2=1 THEN '20000000-0000-0000-0000-000000000004'::uuid ELSE '20000000-0000-0000-0000-000000000001'::uuid END,
CASE WHEN n%2=1 THEN 'request' ELSE 'response' END,jsonb_build_object('summary',E'## Review finding '||n||E'\n\n'||repeat('This is a detailed finding with evidence and a concrete next step. ',25)||E'\n\n```json\n{"instance":"long-instance-reference-0123456789-abcdefghijklmnopqrstuvwxyz","status":"in-progress"}\n```'),n,true,n%2=1,now()-interval '1 hour'+n*interval '1 minute'
FROM generate_series(1,30)n;
UPDATE contracts SET current_turns=30 WHERE id='30000000-0000-0000-0000-000000000007';
INSERT INTO projects(id,title,description,status,owner_user_id,created_by_agent_id,privacy_metadata)VALUES
('40000000-0000-0000-0000-000000000001','Review workspace',E'## Delivery workspace\n\nPreserve the operator workflow while making every detail readable.','active','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','{"version":1,"allow_observer_access":true}') ON CONFLICT DO NOTHING;
INSERT INTO project_members(project_id,agent_id,role)VALUES('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','owner') ON CONFLICT DO NOTHING;
INSERT INTO project_observers(project_id,agent_id,invited_by_agent_id,note)VALUES('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Read-only visual review') ON CONFLICT DO NOTHING;
UPDATE contract_questions SET status='open', answer=null, answered_at=null,
  answered_by_user_id=null, answered_by_name=null
WHERE id='50000000-0000-0000-0000-000000000001';
DELETE FROM contract_notes WHERE contract_id='30000000-0000-0000-0000-000000000001';
INSERT INTO tasks(id,project_id,title,description,status,priority,assignee_agent_id) VALUES
('60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Review fixture · implement release audit findings',E'## Implementation scope\n\nCorrect command-aware instance routing, preserve FIFO order and retain failed deliveries for explicit replay. This work needs clear ownership, review evidence and the full original task brief.\n\n'||repeat(E'Inspect the current implementation across all runtimes, record the exact reviewed commit and verify the expected behavior before completing the work. The description uses the whole work column at desktop widths and wraps naturally on a phone.\n\n',5),'in-review','high','20000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','Review fixture · release audit','done','done','medium','20000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description;
INSERT INTO task_contracts(task_id,contract_id) VALUES
('60000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;
INSERT INTO task_comments(id,task_id,project_id,author_agent_id,author_name,content,comment_type) VALUES
('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Review proposer','Implementation is ready for review. The focused routing and outbox checks passed. Please review the current change before merging.','comment'),
('70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Review proposer',repeat('Keep the review evidence readable across the complete work column. ',12),'comment')
ON CONFLICT (id) DO NOTHING;
-- A recent inactive endpoint exercises second-level delivery labels without dispatching.
INSERT INTO webhooks(id,agent_id,url,secret,is_active,last_delivery_at) VALUES
('80000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','https://review.example.test/delivery','visual-fixture-unused',false,now())
ON CONFLICT (id) DO UPDATE SET is_active=false,last_delivery_at=EXCLUDED.last_delivery_at;
INSERT INTO webhook_deliveries(id,webhook_id,event,status,response_status,delivered_at,created_at,payload) VALUES
('90000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','review.fixture','success',200,now(),now(),'{}')
ON CONFLICT (id) DO UPDATE SET delivered_at=EXCLUDED.delivered_at,created_at=EXCLUDED.created_at;
COMMIT;
