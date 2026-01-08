import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDuration } from '../../tasks/hooks/useTimeLogs';
import type { Organization, Project, TaskWithSection, ReportPeriod } from '../../../types';
import { ClipboardListIcon, CheckCircleIcon, RefreshIcon, TimerIcon, ChartBarIcon, FolderIcon, Button, Card, Select } from '../../../components';
import '../styles/ReportsPage.css';

interface ReportData {
    tasks: TaskWithSection[];
    timeLogs: { task_id: string; duration: number }[];
    taskProjectMap: Record<string, string>; // taskId -> projectId
}

const PERIOD_OPTIONS = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
    { value: 'year', label: 'Last year' },
];

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
                .from('organization_members')
                .select('organization_id, organizations(*)')
                .eq('user_id', user.id)
                .then(({ data }) => {
                    const orgs = data?.map((d: any) => d.organizations).filter(Boolean) || [];
                    setOrganizations(orgs);
                });
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
                setReportData({ tasks: [], timeLogs: [], taskProjectMap: {} });
                return;
            }

            // Fetch tasks via project_tasks junction
            const { data: projectTasks } = await supabase
                .from('project_tasks')
                .select(`
                    project_id,
                    section_id,
                    order_index,
                    task:tasks (*)
                `)
                .in('project_id', projectIds);

            // Build task list and mapping
            const taskProjectMap: Record<string, string> = {};
            const tasks: TaskWithSection[] = (projectTasks || [])
                .filter((pt: any) => {
                    const createdAt = new Date(pt.task?.created_at);
                    return createdAt >= start && createdAt <= end;
                })
                .map((pt: any) => {
                    taskProjectMap[pt.task.id] = pt.project_id;
                    return {
                        ...pt.task,
                        section_id: pt.section_id,
                        order_index: pt.order_index
                    };
                });

            const taskIds = tasks.map((t) => t.id);
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

            setReportData({ tasks, timeLogs, taskProjectMap });
        } catch (err) {
            console.error('Report generation failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const summary = useMemo(() => {
        if (!reportData) return null;

        const { tasks, timeLogs, taskProjectMap } = reportData;
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'done').length;
        const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
        const todo = tasks.filter((t) => t.status === 'todo').length;
        const totalTime = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        const byProject: Record<string, { total: number; done: number; time: number }> = {};
        for (const task of tasks) {
            const projectId = taskProjectMap[task.id];
            if (!projectId) continue;
            if (!byProject[projectId]) {
                byProject[projectId] = { total: 0, done: 0, time: 0 };
            }
            byProject[projectId].total++;
            if (task.status === 'done') byProject[projectId].done++;
        }
        for (const log of timeLogs) {
            const task = tasks.find((t) => t.id === log.task_id);
            if (task) {
                const projectId = taskProjectMap[task.id];
                if (projectId && byProject[projectId]) {
                    byProject[projectId].time += log.duration || 0;
                }
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

    const orgOptions = organizations.map(org => ({ value: org.id, label: org.name }));
    const projectOptions = projects.map(proj => ({ value: proj.id, label: proj.name }));

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
                    <Select
                        label="Organization"
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                        options={orgOptions}
                        placeholder="Select organization"
                    />

                    <Select
                        label="Project (optional)"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        options={projectOptions}
                        placeholder="All projects"
                        disabled={!selectedOrg}
                    />

                    <Select
                        label="Period"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                        options={PERIOD_OPTIONS}
                    />

                    <div className="input-group filter-action">
                        <Button
                            variant="primary"
                            onClick={generateReport}
                            disabled={!selectedOrg || isLoading}
                        >
                            {isLoading ? <span className="loading-spinner" /> : (
                                <>
                                    <ChartBarIcon size={18} /> Generate Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Report Results */}
            {summary && (
                <div className="report-results">
                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <Card className="summary-card">
                            <div className="summary-icon">
                                <ClipboardListIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary.total}</span>
                                <span className="summary-label">Total Tasks</span>
                            </div>
                        </Card>
                        <Card className="summary-card done">
                            <div className="summary-icon">
                                <CheckCircleIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary.done}</span>
                                <span className="summary-label">Completed</span>
                            </div>
                        </Card>
                        <Card className="summary-card progress">
                            <div className="summary-icon">
                                <RefreshIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary.inProgress}</span>
                                <span className="summary-label">In Progress</span>
                            </div>
                        </Card>
                        <Card className="summary-card time">
                            <div className="summary-icon">
                                <TimerIcon size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{formatDuration(summary.totalTime)}</span>
                                <span className="summary-label">Time Logged</span>
                            </div>
                        </Card>
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
