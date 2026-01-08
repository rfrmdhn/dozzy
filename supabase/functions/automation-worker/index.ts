// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
    try {
        const payload = await req.json();

        // Validating Webhook Payload (basic check)
        // Supabase DB Webhook structure: { type: 'INSERT' | 'UPDATE', table: 'tasks', record: {...}, old_record: {...}, schema: 'public' }
        const { type, table, record, old_record } = payload;

        if (table !== 'tasks') {
            return new Response(JSON.stringify({ message: 'Ignored: Not a task event' }), { headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Fetch relevant Rules
        // We look for rules with matching trigger_event
        let triggerEvent = '';
        if (type === 'INSERT') triggerEvent = 'task.created';
        else if (type === 'UPDATE') {
            triggerEvent = 'task.updated';
            // Could be more specific like 'task.updated.status' if desired
        } else {
            return new Response(JSON.stringify({ message: 'Ignored: Unsupported event type' }), { headers: { 'Content-Type': 'application/json' } });
        }

        const { data: rules, error } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('organization_id', record.organization_id) // Scope to org
            .eq('is_active', true)
            .or(`project_id.is.null,project_id.eq.${record.project_id || '00000000-0000-0000-0000-000000000000'}`);
        // Note: project_id might not be on 'tasks' table directly anymore if using project_tasks linkage!
        // But master_schema.sql removed 'project_id' from 'tasks'.
        // So we need to find the project(s) via project_tasks.
        // For simplicity, let's assume rules trigger based on task properties for now, 
        // or we query project linkage.

        if (error) throw error;
        if (!rules || rules.length === 0) {
            return new Response(JSON.stringify({ message: 'No rules found' }), { headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Evaluate Conditions & Execute Actions
        const executedRules = [];

        for (const rule of rules) {
            // Evaluate conditions
            // Example condition: { field: 'priority', operator: 'eq', value: 'urgent' }
            const conditionsMet = checkConditions(rule.conditions, record);

            // Also check if trigger event matches specifically
            if (conditionsMet && rule.trigger_event === triggerEvent) {
                await executeActions(rule.actions, record);
                executedRules.push(rule.id);
            }
        }

        return new Response(
            JSON.stringify({ message: `Processed ${executedRules.length} rules`, rules: executedRules }),
            { headers: { 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }
})

function checkConditions(conditions: any[], record: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(cond => {
        const recordValue = record[cond.field];
        switch (cond.operator) {
            case 'eq': return recordValue == cond.value;
            case 'neq': return recordValue != cond.value;
            // Add other operators (gt, lt, contains, etc.)
            default: return false;
        }
    });
}

async function executeActions(actions: any[], record: any) {
    if (!actions) return;

    for (const action of actions) {
        switch (action.type) {
            case 'update_field':
                // { type: 'update_field', payload: { field: 'priority', value: 'high' } }
                await supabase
                    .from('tasks')
                    .update({ [action.payload.field]: action.payload.value })
                    .eq('id', record.id);
                break;
            case 'add_comment':
                await supabase
                    .from('comments')
                    .insert({
                        task_id: record.id,
                        content: { text: action.payload.text },
                        // user_id: Bot User ID?
                    });
                break;
            // Add other actions (send_notification, move_task, etc.)
        }
    }
}
