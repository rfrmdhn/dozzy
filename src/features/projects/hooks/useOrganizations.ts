import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Organization, OrganizationInput } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

type OrgRole = 'admin' | 'editor' | 'viewer';

interface OrganizationWithRole extends Organization {
    role?: OrgRole;
}

interface UseOrganizationsReturn {
    organizations: OrganizationWithRole[];
    isLoading: boolean;
    error: Error | null;
    create: (input: OrganizationInput) => Promise<Organization | null>;
    update: (id: string, input: Partial<OrganizationInput>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
    getUserRole: (orgId: string) => OrgRole | null;
}

export function useOrganizations(): UseOrganizationsReturn {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchOrganizations = useCallback(async () => {
        if (!user) {
            setOrganizations([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Fetch organizations with user's role via organization_members
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    role,
                    organization:organizations (
                        id,
                        name,
                        description,
                        created_at,
                        updated_at
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to include role in organization object
            const orgsWithRoles: OrganizationWithRole[] = (data || [])
                .filter(item => item.organization)
                .map(item => {
                    const org = item.organization as unknown as Organization;
                    return {
                        ...org,
                        role: item.role as OrgRole
                    };
                });

            setOrganizations(orgsWithRoles);
            setError(null);
        } catch (err) {
            setError(err as Error);
            setOrganizations([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const create = useCallback(
        async (input: OrganizationInput): Promise<Organization | null> => {
            if (!user) return null;

            try {
                // Create organization (trigger will auto-add user as admin)
                const { data, error } = await supabase
                    .from('organizations')
                    .insert({
                        name: input.name,
                        description: input.description,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Add to local state with admin role
                const orgWithRole: OrganizationWithRole = { ...data, role: 'admin' };
                setOrganizations((prev) => [orgWithRole, ...prev]);
                return data;
            } catch (err) {
                setError(err as Error);
                return null;
            }
        },
        [user]
    );

    const update = useCallback(
        async (id: string, input: Partial<OrganizationInput>): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from('organizations')
                    .update(input)
                    .eq('id', id);

                if (error) throw error;
                setOrganizations((prev) =>
                    prev.map((org) => (org.id === id ? { ...org, ...input } : org))
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
            const { error } = await supabase
                .from('organizations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setOrganizations((prev) => prev.filter((org) => org.id !== id));
            return true;
        } catch (err) {
            setError(err as Error);
            return false;
        }
    }, []);

    const getUserRole = useCallback((orgId: string): OrgRole | null => {
        const org = organizations.find(o => o.id === orgId);
        return org?.role || null;
    }, [organizations]);

    return {
        organizations,
        isLoading,
        error,
        create,
        update,
        remove,
        refresh: fetchOrganizations,
        getUserRole,
    };
}

export default useOrganizations;
