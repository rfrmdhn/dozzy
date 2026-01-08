import { useState, useEffect, useCallback } from 'react';
import { projectRepository, type ProjectWithProgress } from '../../../lib/repositories';

interface UseActiveProjectsOptions {
    userId: string | undefined;
    limit?: number;
}

interface UseActiveProjectsReturn {
    projects: ProjectWithProgress[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useActiveProjects({ userId, limit = 5 }: UseActiveProjectsOptions): UseActiveProjectsReturn {
    const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const { projects: projectsWithProgress, error: fetchError } = await projectRepository.fetchWithProgress(limit);

            if (fetchError) throw fetchError;

            setProjects(projectsWithProgress);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return { projects, isLoading, error, refresh: fetchProjects };
}
