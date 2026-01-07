import { FilterIcon, SortIcon, SearchIcon, GridIcon, ListIcon, PlusIcon } from '../atoms/icons';
import { Button } from '../atoms/Button';
import { Input } from '../molecules/Input';
import { useState } from 'react';

interface ProjectsToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filterStatus: string;
    onFilterChange: (status: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onNewProject: () => void;
}

export function ProjectsToolbar({
    searchQuery,
    onSearchChange,
    filterStatus,
    onFilterChange,
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange,
    onNewProject
}: ProjectsToolbarProps) {
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    return (
        <>
            {/* Search Bar */}
            <div className="search-bar">
                <SearchIcon size={18} />
                <Input
                    type="text"
                    placeholder="Search projects, tasks, or tags..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                    containerClassName="mb-0" // Reset margin for this specific usage
                />
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    {/* Filter Dropdown */}
                    <div className="dropdown">
                        <Button variant="secondary" size="sm" onClick={() => setShowFilterMenu(!showFilterMenu)} leftIcon={<FilterIcon size={16} />}>
                            Filter
                        </Button>
                        {showFilterMenu && (
                            <div className="dropdown-menu">
                                {['all', 'active', 'draft', 'delayed'].map(status => (
                                    <button
                                        key={status}
                                        className={`dropdown-item ${filterStatus === status ? 'active' : ''}`}
                                        onClick={() => { onFilterChange(status); setShowFilterMenu(false); }}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="dropdown">
                        <Button variant="secondary" size="sm" onClick={() => setShowSortMenu(!showSortMenu)} leftIcon={<SortIcon size={16} />}>
                            Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Progress'}
                        </Button>
                        {showSortMenu && (
                            <div className="dropdown-menu">
                                {['recent', 'name', 'progress'].map(sort => (
                                    <button
                                        key={sort}
                                        className={`dropdown-item ${sortBy === sort ? 'active' : ''}`}
                                        onClick={() => { onSortChange(sort); setShowSortMenu(false); }}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {sort}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button className={`btn btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => onViewModeChange('grid')}>
                            <GridIcon size={18} />
                        </button>
                        <button className={`btn btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => onViewModeChange('list')}>
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>

                <Button variant="primary" onClick={onNewProject} leftIcon={<PlusIcon size={16} />}>
                    New Project
                </Button>
            </div>
        </>
    );
}
