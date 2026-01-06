import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Organization, OrganizationInput } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

interface UseOrganizationsReturn {
    organizations: Organization[];
    isLoading: boolean;
    error: Error | null;
    create: (input: OrganizationInput) => Promise<Organization | null>;
    update: (id: string, input: Partial<OrganizationInput>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

export function useOrganizations(): UseOrganizationsReturn {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
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
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrganizations(data || []);
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
                const { data, error } = await supabase
                    .from('organizations')
                    .insert({
                        ...input,
                        user_id: user.id,
                    })
                    .select()
                    .single();

                if (error) throw error;
                setOrganizations((prev) => [data, ...prev]);
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

    return {
        organizations,
        isLoading,
        error,
        create,
        update,
        remove,
        refresh: fetchOrganizations,
    };
}

export default useOrganizations;
