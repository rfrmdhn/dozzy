import { BuildingIcon, CalendarIcon, UsersIcon, EditIcon, Button } from '../atoms';
import type { Organization } from '../../types';

// Extended type for rendering
type OrgWithDescription = Organization & { description?: string | null };

interface OrgHeaderProps {
    organization: OrgWithDescription | null;
    orgId?: string;
    projectCount: number;
    onEditOrg: () => void;
}

export function OrgHeader({ organization, orgId, projectCount, onEditOrg }: OrgHeaderProps) {
    return (
        <div className="org-header">
            <div className="org-header-icon">
                <BuildingIcon size={32} />
            </div>
            <div className="org-header-content">
                <h1 className="org-header-title">
                    {orgId ? (organization?.name || 'Organization') : 'All Projects'}
                </h1>

                {orgId ? (
                    organization?.description && (
                        <p className="org-header-description">{organization.description}</p>
                    )
                ) : (
                    <p className="org-header-description">Overview of all your projects across organizations</p>
                )}

                <div className="org-header-meta">
                    {orgId && (
                        <span>
                            <CalendarIcon size={14} />
                            Created {organization?.created_at ? new Date(organization.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                    )}
                    <span><UsersIcon size={14} /> {projectCount} Projects</span>
                </div>
            </div>
            {orgId && (
                <Button variant="secondary" onClick={onEditOrg} leftIcon={<EditIcon size={16} />}>
                    Edit Org
                </Button>
            )}
        </div>
    );
}
