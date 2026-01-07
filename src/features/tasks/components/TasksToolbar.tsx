import type { Dispatch, SetStateAction } from 'react';
import { SearchIcon, ListIcon, KanbanIcon, FilterIcon, SortIcon, PlusIcon } from '../../../components/atoms/icons';
import { Button } from '../../../components/atoms/Button';
import { Input } from '../../../components/molecules/Input';

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
            <div className="search-box-wrapper">
                <Input
                    icon={<SearchIcon size={18} />}
                    className="search-input"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    containerClassName="search-box-container"
                />
            </div>
            <div className="toolbar-actions">
                <div className="view-toggle">
                    <Button
                        variant="ghost"
                        className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List view"
                    >
                        <ListIcon size={18} />
                    </Button>
                    <Button
                        variant="ghost"
                        className={`btn-icon ${viewMode === 'board' ? 'active' : ''}`}
                        onClick={() => setViewMode('board')}
                        title="Board view"
                    >
                        <KanbanIcon size={18} />
                    </Button>
                </div>
                <div className="dropdown">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <FilterIcon size={16} /> Filter
                    </Button>
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
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowSortMenu(!showSortMenu)}
                    >
                        <SortIcon size={16} /> Sort
                    </Button>
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
                <Button variant="primary" onClick={onNewTask}>
                    <PlusIcon size={16} /> New Task
                </Button>
            </div>
        </div>
    );
}
