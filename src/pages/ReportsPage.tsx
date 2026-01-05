import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDuration } from '../hooks/useTimeLogs';
import type { Organization, Project, Task, ReportPeriod } from '../types';

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

    // Load organizations
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

    // Load projects when org changes
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

            // Build project IDs to filter
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

            // Fetch tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .in('project_id', projectIds)
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString());

            // Fetch time logs
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

    // Compute report summary
    const summary = useMemo(() => {
        if (!reportData) return null;

        const { tasks, timeLogs } = reportData;
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'done').length;
        const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
        const todo = tasks.filter((t) => t.status === 'todo').length;
        const totalTime = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        // Group by project
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
                    <p className="text-muted">Analyze your progress and time allocation</p>
                </div>
            </div>

            {/* Filters */}
            <div className="report-filters card">
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
                            {isLoading ? <span className="loading-spinner" /> : 'Generate Report'}
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
                            <span className="summary-value">{summary.total}</span>
                            <span className="summary-label">Total Tasks</span>
                        </div>
                        <div className="summary-card done">
                            <span className="summary-value">{summary.done}</span>
                            <span className="summary-label">Completed</span>
                        </div>
                        <div className="summary-card progress">
                            <span className="summary-value">{summary.inProgress}</span>
                            <span className="summary-label">In Progress</span>
                        </div>
                        <div className="summary-card time">
                            <span className="summary-value">{formatDuration(summary.totalTime)}</span>
                            <span className="summary-label">Time Logged</span>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                        <h3 className="card-title">Completion Rate</h3>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar"
                                style={{ width: `${summary.completionRate}%` }}
                            />
                        </div>
                        <p className="text-muted text-center mt-4">
                            {summary.completionRate}% of tasks completed
                        </p>
                    </div>

                    {/* By Project Table */}
                    {Object.keys(summary.byProject).length > 0 && (
                        <div className="table-container" style={{ marginTop: 'var(--space-6)' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Tasks</th>
                                        <th>Completed</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary.byProject).map(([projectId, data]) => {
                                        const project = projects.find((p) => p.id === projectId);
                                        return (
                                            <tr key={projectId}>
                                                <td>{project?.name || 'Unknown'}</td>
                                                <td>{data.total}</td>
                                                <td>
                                                    {data.done} ({Math.round((data.done / data.total) * 100)}%)
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

            {/* Empty state before generating */}
            {!reportData && !isLoading && (
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3 className="empty-state-title">Generate a Report</h3>
                    <p className="empty-state-description">
                        Select an organization and time period, then click Generate Report to see your
                        progress summary.
                    </p>
                </div>
            )}

            <style>{`
        .report-filters {
          margin-bottom: var(--space-8);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          align-items: end;
        }

        .filter-action {
          display: flex;
          align-items: flex-end;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-4);
        }

        .summary-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-6);
          background: var(--bg-card);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-xl);
        }

        .summary-value {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-white);
        }

        .summary-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-400);
          margin-top: var(--space-2);
        }

        .summary-card.done .summary-value {
          color: var(--color-success);
        }

        .summary-card.progress .summary-value {
          color: var(--color-primary-400);
        }

        .summary-card.time .summary-value {
          background: linear-gradient(135deg, var(--color-primary-400), var(--color-secondary-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .progress-bar-container {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-top: var(--space-4);
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary-500), var(--color-success));
          border-radius: var(--radius-full);
          transition: width var(--transition-slow);
        }

        @media (max-width: 640px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
