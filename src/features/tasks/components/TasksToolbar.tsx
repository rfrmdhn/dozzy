import type { Dispatch, SetStateAction } from 'react';
import { SearchIcon, ListIcon, KanbanIcon, FilterIcon, SortIcon, PlusIcon } from '../../../components/atoms/icons';

interface TasksToolbarProps {
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    viewMode: 'list' | 'board';
    setViewMode: Dispatch<SetStateAction<'list' | 'board'>>;
    filterStatus: string;
    setFilterStatus: Dispatch<SetStateAction<string>>;
    sortBy: string;
    setSortBy: Dispatch<SetStateAction<string>>;
    onNewTask: () => void;
    showFilterMenu: boolean;
    setShowFilterMenu: Dispatch<SetStateAction<boolean>>;
    showSortMenu: boolean;
    setShowSortMenu: Dispatch<SetStateAction<boolean>>;
}

export function TasksToolbar({
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    onNewTask,
    showFilterMenu,
    setShowFilterMenu,
    showSortMenu,
    setShowSortMenu,
}: TasksToolbarProps) {
    return (
        <div className="tasks-toolbar">
            <div className="search-box">
                <SearchIcon size={18} className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="toolbar-actions">
                <div className="view-toggle">
                    <button
                        className={`btn btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List view"
                    >
                        <ListIcon size={18} />
                    </button>
                    <button
                        className={`btn btn-icon ${viewMode === 'board' ? 'active' : ''}`}
                        onClick={() => setViewMode('board')}
                        title="Board view"
                    >
                        <KanbanIcon size={18} />
                    </button>
                </div>
                <div className="dropdown">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <FilterIcon size={16} /> Filter
                    </button>
                    {showFilterMenu && (
                        <div className="dropdown-menu">
                            <button
                                className={`dropdown-item ${filterStatus === 'all' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterStatus('all');
                                    setShowFilterMenu(false);
                                }}
                            >
                                All
                            </button>
                            <button
                                className={`dropdown-item ${filterStatus === 'todo' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterStatus('todo');
                                    setShowFilterMenu(false);
                                }}
                            >
                                To Do
                            </button>
                            <button
                                className={`dropdown-item ${filterStatus === 'in_progress' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterStatus('in_progress');
                                    setShowFilterMenu(false);
                                }}
                            >
                                In Progress
                            </button>
                            <button
                                className={`dropdown-item ${filterStatus === 'done' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterStatus('done');
                                    setShowFilterMenu(false);
                                }}
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
                <div className="dropdown">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowSortMenu(!showSortMenu)}
                    >
                        <SortIcon size={16} /> Sort
                    </button>
                    {showSortMenu && (
                        <div className="dropdown-menu">
                            <button
                                className={`dropdown-item ${sortBy === 'date' ? 'active' : ''}`}
                                onClick={() => {
                                    setSortBy('date');
                                    setShowSortMenu(false);
                                }}
                            >
                                Date
                            </button>
                            <button
                                className={`dropdown-item ${sortBy === 'priority' ? 'active' : ''}`}
                                onClick={() => {
                                    setSortBy('priority');
                                    setShowSortMenu(false);
                                }}
                            >
                                Priority
                            </button>
                            <button
                                className={`dropdown-item ${sortBy === 'name' ? 'active' : ''}`}
                                onClick={() => {
                                    setSortBy('name');
                                    setShowSortMenu(false);
                                }}
                            >
                                Name
                            </button>
                        </div>
                    )}
                </div>
                <button className="btn btn-primary" onClick={onNewTask}>
                    <PlusIcon size={16} /> New Task
                </button>
            </div>
        </div>
    );
}
