import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { ProjectMember, ProjectRole } from '../../../types';

interface UseProjectMembersReturn {
    members: ProjectMember[];
    isLoading: boolean;
    error: Error | null;
    addMember: (userId: string, role: ProjectRole) => Promise<boolean>;
    updateRole: (memberId: string, newRole: ProjectRole) => Promise<boolean>;
    removeMember: (memberId: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

export function useProjectMembers(projectId: string | undefined): UseProjectMembersReturn {
    const { user } = useAuth();
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!projectId || !user) {
            setMembers([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('project_members')
                .select(`
                    *,
                    user:users (
                        id,
                        username,
                        email
                    )
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching project members:', err);
            setError(err as Error);
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, user]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const addMember = useCallback(
        async (userId: string, role: ProjectRole): Promise<boolean> => {
            if (!projectId || !user) return false;

            try {
                const { data, error } = await supabase
                    .from('project_members')
                    .insert({
                        project_id: projectId,
                        user_id: userId,
                        role,
                    })
                    .select(`
                        *,
                        user:users (id, username, email)
                    `)
                    .single();

                if (error) throw error;
                setMembers(prev => [...prev, data]);
                return true;
            } catch (err) {
                console.error('Error adding project member:', err);
                setError(err as Error);
                return false;
            }
        },
        [projectId, user]
    );

    const updateRole = useCallback(
        async (memberId: string, newRole: ProjectRole): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from('project_members')
                    .update({ role: newRole })
                    .eq('id', memberId);

                if (error) throw error;
                setMembers(prev =>
                    prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
                );
                return true;
            } catch (err) {
                setError(err as Error);
                return false;
            }
        },
        []
    );

    const removeMember = useCallback(
        async (memberId: string): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from('project_members')
                    .delete()
                    .eq('id', memberId);

                if (error) throw error;
                setMembers(prev => prev.filter(m => m.id !== memberId));
                return true;
            } catch (err) {
                setError(err as Error);
                return false;
            }
        },
        []
    );

    return {
        members,
        isLoading,
        error,
        addMember,
        updateRole,
        removeMember,
        refresh: fetchMembers,
    };
}
