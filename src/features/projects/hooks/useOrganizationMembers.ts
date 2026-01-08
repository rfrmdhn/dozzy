import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export type OrgRole = 'admin' | 'editor' | 'viewer';

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrgRole;
    invited_by: string | null;
    created_at: string;
    updated_at: string;
    // Joined user data
    user?: {
        id: string;
        username: string | null;
        email: string | null;
    };
}

interface UseOrganizationMembersReturn {
    members: OrganizationMember[];
    isLoading: boolean;
    error: Error | null;
    addMember: (userId: string, role: OrgRole) => Promise<boolean>;
    updateRole: (memberId: string, newRole: OrgRole) => Promise<boolean>;
    removeMember: (memberId: string) => Promise<boolean>;
    refresh: () => Promise<void>;
    currentUserRole: OrgRole | null;
    canManageMembers: boolean;
    canChangeRoles: boolean;
}

export function useOrganizationMembers(organizationId: string | undefined): UseOrganizationMembersReturn {
    const { user } = useAuth();
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!organizationId || !user) {
            setMembers([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    *,
                    user:users (
                        id,
                        username,
                        email
                    )
                `)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
            setError(null);
        } catch (err) {
            setError(err as Error);
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, [organizationId, user]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Get current user's role in this organization
    const currentUserRole = members.find(m => m.user_id === user?.id)?.role || null;

    // Permission checks based on role
    const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'editor';
    const canChangeRoles = currentUserRole === 'admin';

    const addMember = useCallback(
        async (userId: string, role: OrgRole): Promise<boolean> => {
            if (!organizationId || !user || !canManageMembers) return false;

            try {
                const { data, error } = await supabase
                    .from('organization_members')
                    .insert({
                        organization_id: organizationId,
                        user_id: userId,
                        role,
                        invited_by: user.id,
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
                setError(err as Error);
                return false;
            }
        },
        [organizationId, user, canManageMembers]
    );

    const updateRole = useCallback(
        async (memberId: string, newRole: OrgRole): Promise<boolean> => {
            if (!canChangeRoles) return false;

            try {
                const { error } = await supabase
                    .from('organization_members')
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
        [canChangeRoles]
    );

    const removeMember = useCallback(
        async (memberId: string): Promise<boolean> => {
            if (!canManageMembers) return false;

            // Find the member to check if editor is trying to remove admin
            const memberToRemove = members.find(m => m.id === memberId);
            if (currentUserRole === 'editor' && memberToRemove?.role === 'admin') {
                setError(new Error('Editors cannot remove admins'));
                return false;
            }

            try {
                const { error } = await supabase
                    .from('organization_members')
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
        [canManageMembers, currentUserRole, members]
    );

    return {
        members,
        isLoading,
        error,
        addMember,
        updateRole,
        removeMember,
        refresh: fetchMembers,
        currentUserRole,
        canManageMembers,
        canChangeRoles,
    };
}

export default useOrganizationMembers;
