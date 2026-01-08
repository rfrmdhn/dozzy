import { useNavigate } from 'react-router-dom';
import { BuildingIcon, PlusIcon, Button } from '../../../components';
import { OrganizationCard } from '../../../components/molecules';
import type { Organization } from '../../../types';

interface OrganizationsSectionProps {
    organizations: Organization[];
    orgStats: Record<string, { projectCount: number; memberCount: number }>;
    isLoading: boolean;
    onCreateOrg: () => void;
    onEditOrg: (org: Organization) => void;
    onDeleteOrg: (orgId: string, e: React.MouseEvent) => void;
}

export function OrganizationsSection({
    organizations,
    orgStats,
    isLoading,
    onCreateOrg,
    onEditOrg,
    onDeleteOrg,
}: OrganizationsSectionProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Your Organizations</h2>
                </div>
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="section">
            <div className="section-header">
                <h2 className="section-title">Your Organizations</h2>
                {organizations.length > 0 && (
                    <Button variant="link" onClick={() => navigate('/organizations')} className="view-all-btn">
                        View All
                    </Button>
                )}
            </div>

            {organizations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><BuildingIcon size={48} /></div>
                    <h3 className="empty-state-title">No organizations yet</h3>
                    <p className="empty-state-description">
                        Create your first organization to start managing projects and tasks.
                    </p>
                    <Button variant="primary" onClick={onCreateOrg}>
                        <PlusIcon size={16} /> Create Organization
                    </Button>
                </div>
            ) : (
                <div className="org-grid">
                    {organizations.slice(0, 2).map((org, index) => (
                        <OrganizationCard
                            key={org.id}
                            id={org.id}
                            name={org.name}
                            description={(org as { description?: string }).description || ''}
                            variant={index % 2 === 0 ? 'dark' : 'teal'}
                            projectCount={orgStats[org.id]?.projectCount || 0}
                            memberCount={orgStats[org.id]?.memberCount || 1}
                            onClick={() => navigate(`/organizations/${org.id}/projects`)}
                            onEdit={() => onEditOrg(org)}
                            onDelete={(e) => onDeleteOrg(org.id, e)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
