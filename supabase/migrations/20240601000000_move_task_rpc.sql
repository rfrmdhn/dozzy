-- RPC for moving tasks between sections or reordering within section
CREATE OR REPLACE FUNCTION move_task(
    p_task_id UUID,
    p_project_id UUID,
    p_new_section_id UUID, -- Can be NULL for backlog/unsectioned
    p_new_index INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_section_id UUID;
  v_old_index INTEGER;
BEGIN
    -- Get current position
    SELECT section_id, order_index INTO v_old_section_id, v_old_index
    FROM project_tasks
    WHERE task_id = p_task_id AND project_id = p_project_id;

    -- If moving within same section
    IF (v_old_section_id IS NOT DISTINCT FROM p_new_section_id) THEN
        IF v_old_index < p_new_index THEN
             -- Moving down: Shift items between old and new up
             UPDATE project_tasks
             SET order_index = order_index - 1
             WHERE project_id = p_project_id
               AND section_id IS NOT DISTINCT FROM p_new_section_id
               AND order_index > v_old_index 
               AND order_index <= p_new_index;
        ELSE
             -- Moving up: Shift items between new and old down
             UPDATE project_tasks
             SET order_index = order_index + 1
             WHERE project_id = p_project_id
               AND section_id IS NOT DISTINCT FROM p_new_section_id
               AND order_index >= p_new_index 
               AND order_index < v_old_index;
        END IF;

    ELSE -- Moving to different section
        -- 1. Close gap in old section
        UPDATE project_tasks
        SET order_index = order_index - 1
        WHERE project_id = p_project_id
          AND section_id IS NOT DISTINCT FROM v_old_section_id
          AND order_index > v_old_index;

        -- 2. Open space in new section
        UPDATE project_tasks
        SET order_index = order_index + 1
        WHERE project_id = p_project_id
          AND section_id IS NOT DISTINCT FROM p_new_section_id
          AND order_index >= p_new_index;
    END IF;

    -- Update target task
    UPDATE project_tasks
    SET section_id = p_new_section_id,
        order_index = p_new_index
    WHERE task_id = p_task_id AND project_id = p_project_id;

END;
$$;
