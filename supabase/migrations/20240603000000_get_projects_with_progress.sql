-- Function to get active projects with progress percentage
-- usage: select * from get_projects_with_progress(5);

CREATE OR REPLACE FUNCTION get_projects_with_progress(limit_val int)
RETURNS TABLE (
  id uuid,
  name text,
  org_id uuid,
  org_name text,
  progress int,
  due_date timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    o.id as org_id,
    o.name as org_name,
    CASE
      WHEN count(pt.task_id) = 0 THEN 0
      ELSE (count(case when t.status = 'done' then 1 end)::float / count(pt.task_id)::float * 100)::int
    END as progress,
    p.due_date
  FROM projects p
  JOIN organizations o ON p.organization_id = o.id
  LEFT JOIN project_tasks pt ON p.id = pt.project_id
  LEFT JOIN tasks t ON pt.task_id = t.id
  WHERE p.status = 'active'
  GROUP BY p.id, p.name, o.id, o.name, p.due_date
  ORDER BY p.updated_at DESC
  LIMIT limit_val;
END;
$$;
