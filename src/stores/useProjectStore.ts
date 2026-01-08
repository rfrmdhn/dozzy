import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type Section = Database['public']['Tables']['project_sections']['Row'];

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    sections: Section[];
    isLoading: boolean;

    fetchProjects: (orgId: string, teamId?: string) => Promise<void>;
    fetchProjectDetails: (projectId: string) => Promise<void>;
    createProject: (project: Partial<Project>) => Promise<Project | null>;
    createSection: (projectId: string, name: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    sections: [],
    isLoading: false,

    fetchProjects: async (orgId, teamId) => {
        set({ isLoading: true });
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
            set({ projects: data || [], isLoading: false });
        } catch (error) {
            console.error('Error fetching projects:', error);
            set({ isLoading: false });
        }
    },

    fetchProjectDetails: async (projectId) => {
        set({ isLoading: true });
        try {
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;

            const { data: sections, error: sectionsError } = await supabase
                .from('project_sections')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (sectionsError) throw sectionsError;

            set({ currentProject: project, sections: sections || [], isLoading: false });
        } catch (error) {
            console.error('Error fetching project details:', error);
            set({ isLoading: false });
        }
    },

    createProject: async (project) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert(project)
                .select()
                .single();

            if (error) throw error;

            const currentProjects = get().projects;
            set({ projects: [data, ...currentProjects] });
            return data;
        } catch (error) {
            console.error('Error creating project:', error);
            return null;
        }
    },

    createSection: async (projectId, name) => {
        try {
            const { data, error } = await supabase
                .from('project_sections')
                .insert({ project_id: projectId, name })
                .select()
                .single();

            if (error) throw error;

            const currentSections = get().sections;
            set({ sections: [...currentSections, data] });
        } catch (error) {
            console.error('Error creating section:', error);
        }
    }
}));
