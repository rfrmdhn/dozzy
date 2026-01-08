-- Automation Rules Table
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- Null means org-level rule
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL, -- e.g., 'task.created', 'task.updated.status', 'task.updated.assignee'
    conditions JSONB DEFAULT '[]'::jsonb, -- Array of { field, operator, value }
    actions JSONB DEFAULT '[]'::jsonb, -- Array of { type, payload }
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org automation rules" ON public.automation_rules FOR SELECT USING (
    is_org_member(organization_id)
);

CREATE POLICY "Manage org automation rules" ON public.automation_rules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = automation_rules.organization_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'member') -- Assuming members can create rules
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_automation_rules_modtime BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
