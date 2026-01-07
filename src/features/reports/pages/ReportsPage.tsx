import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDuration } from '../../tasks/hooks/useTimeLogs';
import type { Organization, Project, Task, ReportPeriod } from '../../../types';
import { ClipboardListIcon, CheckCircleIcon, RefreshIcon, TimerIcon, ChartBarIcon, FolderIcon } from '../../../components/atoms/icons';
import '../styles/ReportsPage.css';

interface ReportData {
    tasks: Task[];
    timeLogs: { task_id: string; duration: number }[];
}

export default function ReportsPage() {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [period, setPeriod] = useState<ReportPeriod>('week');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            supabase
                .from('organizations')
                .select('*')
                .eq('user_id', user.id)
                .order('name')
                .then(({ data }) => setOrganizations(data || []));
        }
    }, [user]);

    useEffect(() => {
        if (selectedOrg) {
            supabase
                .from('projects')
                .select('*')
                .eq('organization_id', selectedOrg)
                .order('name')
                .then(({ data }) => setProjects(data || []));
        } else {
            setProjects([]);
        }
        setSelectedProject('');
    }, [selectedOrg]);

    const getDateRange = (period: ReportPeriod): { start: Date; end: Date } => {
        const end = new Date();
        const start = new Date();

        switch (period) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
        }

        return { start, end };
    };

    const generateReport = async () => {
        if (!selectedOrg) return;
        setIsLoading(true);

        try {
            const { start, end } = getDateRange(period);

            let projectIds: string[] = [];
            if (selectedProject) {
                projectIds = [selectedProject];
            } else {
                const { data: orgProjects } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('organization_id', selectedOrg);
                projectIds = orgProjects?.map((p) => p.id) || [];
            }

            if (projectIds.length === 0) {
                setReportData({ tasks: [], timeLogs: [] });
                return;
            }

            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .in('project_id', projectIds)
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString());

            const taskIds = tasks?.map((t) => t.id) || [];
            let timeLogs: { task_id: string; duration: number }[] = [];

            if (taskIds.length > 0) {
                const { data: logs } = await supabase
                    .from('time_logs')
                    .select('task_id, duration')
                    .in('task_id', taskIds)
                    .gte('start_time', start.toISOString())
                    .lte('start_time', end.toISOString());
                timeLogs = logs || [];
            }

            setReportData({ tasks: tasks || [], timeLogs });
        } catch (err) {
            console.error('Report generation failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const summary = useMemo(() => {
        if (!reportData) return null;

        const { tasks, timeLogs } = reportData;
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'done').length;
        const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
        const todo = tasks.filter((t) => t.status === 'todo').length;
        const totalTime = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        const byProject: Record<string, { total: number; done: number; time: number }> = {};
        for (const task of tasks) {
            if (!byProject[task.project_id]) {
                byProject[task.project_id] = { total: 0, done: 0, time: 0 };
            }
            byProject[task.project_id].total++;
            if (task.status === 'done') byProject[task.project_id].done++;
        }
        for (const log of timeLogs) {
            const task = tasks.find((t) => t.id === log.task_id);
            if (task && byProject[task.project_id]) {
                byProject[task.project_id].time += log.duration || 0;
            }
        }

        return {
            total,
            done,
            inProgress,
            todo,
            totalTime,
            byProject,
            completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        };
    }, [reportData]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Analyze your progress and time allocation</p>
                </div>
            </div>

            {/* Filters */}
            <div className="report-filters">
                <div className="filters-grid">
                    <div className="input-group">
                        <label className="input-label">Organization</label>
                        <select
                            className="input"
                            value={selectedOrg}
                            onChange={(e) => setSelectedOrg(e.target.value)}
                        >
                            <option value="">Select organization</option>
                            {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Project (optional)</label>
                        <select
                            className="input"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            disabled={!selectedOrg}
                        >
                            <option value="">All projects</option>
                            {projects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                    {proj.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Period</label>
                        <select
                            className="input"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                        >
                            <option value="day">Today</option>
                            <option value="week">Last 7 days</option>
                            <option value="month">Last 30 days</option>
                            <option value="year">Last year</option>
                        </select>
                    </div>

                    <div className="input-group filter-action">
                        <button
                            className="btn btn-primary"
                            onClick={generateReport}
                            disabled={!selectedOrg || isLoading}
                        >
                            {isLoading ? <span className="loading-spinner" /> : (
                                <>
                                    <ChartBarIcon size={18} /> Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Results */}
            {summary && (
                <div className="report-results">
                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <ClipboardListIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary.total}</span>
                                <span className="summary-label">Total Tasks</span>
                            </div>
                        </div>
                        <div className="summary-card done">
                            <div className="summary-icon">
                                <CheckCircleIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary.done}</span>
                                <span className="summary-label">Completed</span>
                            </div>
                        </div>
                        <div className="summary-card progress">
                            <div className="summary-icon">
                                <RefreshIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary.inProgress}</span>
                                <span className="summary-label">In Progress</span>
                            </div>
                        </div>
                        <div className="summary-card time">
                            <div className="summary-icon">
                                <TimerIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{formatDuration(summary.totalTime)}</span>
                                <span className="summary-label">Time Logged</span>
                            </div>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="completion-card">
                        <div className="completion-header">
                            <h3>Completion Rate</h3>
                            <span className="completion-percent">{summary.completionRate}%</span>
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className={`progress-bar ${summary.completionRate > 70 ? 'success' : summary.completionRate > 40 ? '' : 'warning'}`}
                                style={{ width: `${summary.completionRate}%` }}
                            />
                        </div>
                        <p className="completion-text">
                            {summary.done} of {summary.total} tasks completed
                        </p>
                    </div>

                    {/* By Project Table */}
                    {Object.keys(summary.byProject).length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Tasks</th>
                                        <th>Completed</th>
                                        <th>Time Logged</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary.byProject).map(([projectId, data]) => {
                                        const project = projects.find((p) => p.id === projectId);
                                        return (
                                            <tr key={projectId}>
                                                <td className="project-name-cell">
                                                    <span className="project-icon">
                                                        <FolderIcon size={16} />
                                                    </span>
                                                    {project?.name || 'Unknown'}
                                                </td>
                                                <td>{data.total}</td>
                                                <td>
                                                    <span className="completion-badge">
                                                        {data.done}/{data.total} ({Math.round((data.done / data.total) * 100)}%)
                                                    </span>
                                                </td>
                                                <td>{formatDuration(data.time)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!reportData && !isLoading && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <ChartBarIcon size={48} />
                    </div>
                    <h3 className="empty-state-title">Generate a Report</h3>
                    <p className="empty-state-description">
                        Select an organization and time period, then click Generate Report
                        to see your progress summary.
                    </p>
                </div>
            )}


        </div>
    );
}
