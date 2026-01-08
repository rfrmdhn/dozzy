import { create } from 'zustand';
import { projectRepository, type ProjectWithOrg } from '../lib/repositories';
import type { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type Section = Database['public']['Tables']['project_sections']['Row'];

interface ProjectState {
    projects: Project[];
    currentProject: ProjectWithOrg | null;
    sections: Section[];
    isLoading: boolean;
    error: Error | null;

    // Actions
    fetchProjects: (orgId: string, teamId?: string) => Promise<void>;
    fetchProjectDetails: (projectId: string) => Promise<void>;
    createProject: (project: Partial<ProjectInsert>) => Promise<Project | null>;
    updateProject: (projectId: string, updates: Partial<ProjectUpdate>) => Promise<boolean>;
    deleteProject: (projectId: string) => Promise<boolean>;
    createSection: (projectId: string, name: string) => Promise<boolean>;
    clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    sections: [],
    isLoading: false,
    error: null,

    fetchProjects: async (orgId, teamId) => {
        set({ isLoading: true, error: null });

        const { projects, error } = await projectRepository.fetchByOrg(orgId, teamId);

        if (error) {
            set({ isLoading: false, error });
            console.error('Error fetching projects:', error);
            return;
        }

        set({ projects, isLoading: false });
    },

    fetchProjectDetails: async (projectId) => {
        set({ isLoading: true, error: null });

        const [projectResult, sectionsResult] = await Promise.all([
            projectRepository.fetchById(projectId),
            projectRepository.fetchSections(projectId),
        ]);

        if (projectResult.error) {
            set({ isLoading: false, error: projectResult.error });
            console.error('Error fetching project details:', projectResult.error);
            return;
        }

        set({
            currentProject: projectResult.project,
            sections: sectionsResult.sections,
            isLoading: false,
        });
    },

    createProject: async (project) => {
        const projectInsert: ProjectInsert = {
            name: project.name || 'Untitled Project',
            organization_id: project.organization_id,
            team_id: project.team_id,
            owner_id: project.owner_id,
            description: project.description,
            status: project.status || 'active',
            start_date: project.start_date,
            due_date: project.due_date,
            icon: project.icon,
            color: project.color,
        };

        const { data, error } = await projectRepository.create(projectInsert);

        if (error) {
            set({ error });
            console.error('Error creating project:', error);
            return null;
        }

        if (data) {
            const currentProjects = get().projects;
            set({ projects: [data, ...currentProjects] });
        }

        return data;
    },

    updateProject: async (projectId, updates) => {
        // Optimistic update
        const currentProjects = get().projects;
        const updatedProjects = currentProjects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
        );
        set({ projects: updatedProjects });

        const { data, error } = await projectRepository.update(projectId, updates);

        if (error) {
            // Revert on error
            set({ projects: currentProjects, error });
            console.error('Error updating project:', error);
            return false;
        }

        // Update current project if it's the one being edited
        const current = get().currentProject;
        if (current && current.id === projectId && data) {
            set({ currentProject: { ...current, ...data } });
        }

        return true;
    },

    deleteProject: async (projectId) => {
        // Optimistic update
        const currentProjects = get().projects;
        set({ projects: currentProjects.filter((p) => p.id !== projectId) });

        const { success, error } = await projectRepository.delete(projectId);

        if (error || !success) {
            // Revert on error
            set({ projects: currentProjects, error });
            console.error('Error deleting project:', error);
            return false;
        }

        return true;
    },

    createSection: async (projectId, name) => {
        const { section, error } = await projectRepository.createSection(projectId, name);

        if (error) {
            set({ error });
            console.error('Error creating section:', error);
            return false;
        }

        if (section) {
            const currentSections = get().sections;
            set({ sections: [...currentSections, section] });
        }

        return true;
    },

    clearError: () => set({ error: null }),
}));

// Re-export types for convenience
export type { ProjectWithOrg };
