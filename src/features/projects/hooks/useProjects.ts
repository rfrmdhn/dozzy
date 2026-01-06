import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Project, ProjectInput } from '../../../types';

interface UseProjectsReturn {
    projects: Project[];
    isLoading: boolean;
    error: Error | null;
    create: (input: ProjectInput) => Promise<Project | null>;
    update: (id: string, input: Partial<ProjectInput>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

export function useProjects(organizationId?: string): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!organizationId) {
            setProjects([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
            setError(null);
        } catch (err) {
            setError(err as Error);
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const create = useCallback(
        async (input: ProjectInput): Promise<Project | null> => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .insert(input)
                    .select()
                    .single();

                if (error) throw error;
                setProjects((prev) => [data, ...prev]);
                return data;
            } catch (err) {
                setError(err as Error);
                return null;
            }
        },
        []
    );

    const update = useCallback(
        async (id: string, input: Partial<ProjectInput>): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from('projects')
                    .update(input)
                    .eq('id', id);

                if (error) throw error;
                setProjects((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, ...input } : p))
                );
                return true;
            } catch (err) {
                setError(err as Error);
                return false;
            }
        },
        []
    );

    const remove = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);

            if (error) throw error;
            setProjects((prev) => prev.filter((p) => p.id !== id));
            return true;
        } catch (err) {
            setError(err as Error);
            return false;
        }
    }, []);

    return {
        projects,
        isLoading,
        error,
        create,
        update,
        remove,
        refresh: fetchProjects,
    };
}

export default useProjects;
