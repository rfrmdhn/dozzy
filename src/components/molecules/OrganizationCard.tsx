import { BuildingIcon, UsersIcon, EditIcon, TrashIcon } from '../atoms/icons';
import { Button } from '../atoms';
import './OrganizationCard.css';

interface OrganizationCardProps {
    id: string;
    name: string;
    description?: string | null;
    projectCount?: number;
    memberCount?: number;
    variant?: 'blue' | 'teal' | 'dark'; // For header gradient
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

export function OrganizationCard({
    name,
    description,
    projectCount = 0,
    memberCount = 1,
    variant = 'dark',
    onClick,
    onEdit,
    onDelete
}: OrganizationCardProps) {

    // Determine variant based on name hash or passed prop if simple random logic is needed
    // For now we use the passed variant or default

    return (
        <div className="org-card-container" onClick={onClick}>
            {/* Header Image */}
            <div className={`org-card-header org-card-header--${variant}`}>
                {/* Actions (Edit/Delete) overlay */}
                <div className="org-card-actions" onClick={(e) => e.stopPropagation()}>
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={onEdit}>
                            <EditIcon size={16} />
                        </Button>
                    )}
                    {onDelete && (
                        <Button variant="ghost" size="sm" onClick={onDelete}>
                            <TrashIcon size={16} />
                        </Button>
                    )}
                </div>

                {/* Floating Icon */}
                <div className="org-card-icon-wrapper">
                    <BuildingIcon size={24} />
                </div>
            </div>

            {/* Content Body */}
            <div className="org-card-body">
                <div className="org-card-title">{name}</div>
                <div className="org-card-description">{description || 'No description'}</div>

                <div className="org-card-meta">
                    <div className="org-card-meta-item">
                        <span className={`meta-dot ${projectCount > 0 ? 'meta-dot--success' : 'meta-dot--warning'}`}></span>
                        <span>{projectCount} Projects</span>
                    </div>
                    <div className="org-card-meta-item">
                        <UsersIcon size={16} />
                        <span>{memberCount} Member{memberCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
