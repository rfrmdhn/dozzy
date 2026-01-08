import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type Section = Database['public']['Tables']['project_sections']['Row'];

export interface ProjectWithOrg extends Project {
    organization?: {
        id: string;
        name: string;
    } | null;
}

export interface ProjectWithProgress {
    id: string;
    name: string;
    org_id: string;
    org_name: string;
    progress: number;
    due_date: string | null;
}

export interface FetchProjectsResult {
    projects: Project[];
    error: Error | null;
}

export interface ProjectOperationResult {
    data: Project | null;
    error: Error | null;
}

export interface FetchSectionsResult {
    sections: Section[];
    error: Error | null;
}

/**
 * Repository for Project data access operations.
 * Centralizes all Supabase queries for projects.
 */
export const projectRepository = {
    /**
     * Fetch all projects for an organization
     */
    async fetchByOrg(orgId: string, teamId?: string): Promise<FetchProjectsResult> {
        try {
            let query = supabase
                .from('projects')
                .select('*')
                .eq('organization_id', orgId);

            if (teamId) {
                query = query.eq('team_id', teamId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return { projects: data || [], error: null };
        } catch (err) {
            return { projects: [], error: err as Error };
        }
    },

    /**
     * Fetch a single project with organization info
     */
    async fetchById(projectId: string): Promise<{ project: ProjectWithOrg | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*, organizations(id, name)')
                .eq('id', projectId)
                .single();

            if (error) throw error;

            const project: ProjectWithOrg = {
                ...data,
                organization: data.organizations as ProjectWithOrg['organization'],
            };

            return { project, error: null };
        } catch (err) {
            return { project: null, error: err as Error };
        }
    },

    /**
     * Fetch project sections
     */
    async fetchSections(projectId: string): Promise<FetchSectionsResult> {
        try {
            const { data, error } = await supabase
                .from('project_sections')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            return { sections: data || [], error: null };
        } catch (err) {
            return { sections: [], error: err as Error };
        }
    },

    /**
     * Fetch projects with calculated progress using dedicated RPC
     */
    async fetchWithProgress(limit: number = 5): Promise<{ projects: ProjectWithProgress[]; error: Error | null }> {
        try {
            const { data, error } = await supabase.rpc('get_projects_with_progress', { limit_val: limit });

            if (error) throw error;

            const projects: ProjectWithProgress[] = (data || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                org_id: p.org_id,
                org_name: p.org_name,
                progress: p.progress || 0,
                due_date: p.due_date,
            }));

            return { projects, error: null };
        } catch (err) {
            return { projects: [], error: err as Error };
        }
    },

    /**
     * Create a new project
     */
    async create(project: ProjectInsert): Promise<ProjectOperationResult> {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert(project)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Update an existing project
     */
    async update(projectId: string, updates: ProjectUpdate): Promise<ProjectOperationResult> {
        try {
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Delete a project
     */
    async delete(projectId: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) throw error;
            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    },

    /**
     * Create a project section
     */
    async createSection(projectId: string, name: string): Promise<{ section: Section | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('project_sections')
                .insert({ project_id: projectId, name })
                .select()
                .single();

            if (error) throw error;
            return { section: data, error: null };
        } catch (err) {
            return { section: null, error: err as Error };
        }
    },
};

export default projectRepository;
