import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const API = "https://centralised-feedback-system.onrender.com";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
    LogOut, PlusCircle, CheckCircle, LayoutDashboard, FileText, Settings, Menu, X,
    Trash2, Download, TrendingUp, History, Users, MessageSquare, Calendar, ChevronRight, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CreateFormModal from '../components/CreateFormModal';
import FeedbackFormModal from '../components/FeedbackFormModal';

// --- Improved Component Styles ---
const Card = ({ children, className = "", delay = 0, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        onClick={onClick}
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${className}`}
    >
        {children}
    </motion.div>
);

const StatCard = ({ title, value, subtext, icon: Icon, color, delay }) => (
    <Card delay={delay} className="relative overflow-hidden group">
        <div className={`absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon className="w-24 h-24 transform translate-x-8 -translate-y-8" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
                <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </Card>
);

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activeForms, setActiveForms] = useState([]);
    const [userHistory, setUserHistory] = useState([]);
    const [adminForms, setAdminForms] = useState([]);
    const [stats, setStats] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [analyticsView, setAnalyticsView] = useState('charts');

    useEffect(() => {
        if (user?.role === 'Admin') {
            fetchAdminData();
        } else {
            fetchUserForms();
            fetchUserHistory();
        }
    }, [user]);

    const fetchUserForms = async () => {
        try {
            const res = await axios.get(`${API}/api/feedback/active`);
            setActiveForms(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchUserHistory = async () => {
        try {
            const res = await axios.get(`${API}/api/feedback/history`);
            setUserHistory(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchAdminData = async () => {
        try {
            const res = await axios.get(`${API}/api/feedback/all`);
            setAdminForms(res.data);
        } catch (error) { console.error(error); }
    };

    const deleteForm = async (formId) => {
        if (!window.confirm("Are you sure? This will delete all responses associated with this form.")) return;
        try {
            await axios.delete(`${API}/api/feedback/delete/${formId}`);
            toast.success("Form deleted");
            fetchAdminData();
            if (stats && stats.formId === formId) {
                setStats(null);
                setActiveTab('overview');
            }
        } catch (error) { toast.error("Failed to delete form"); }
    };

    const exportReport = (formId) => {
        if (!stats) return toast.error("Please view analytics first");

        let csvContent = "data:text/csv;charset=utf-8,";

        // Header
        csvContent += "Response ID,User,Role,Department,Date,Sentiment Score,Avg Rating\n";

        // Rows
        stats.responses.forEach(r => {
            const row = [
                r.id,
                `"${r.user}"`,
                r.role,
                r.department || "N/A",
                new Date(r.date).toLocaleDateString(),
                r.sentiment,
                r.avgRating
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${stats.formTitle.replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const viewStats = async (formId) => {
        try {
            const res = await axios.get(`${API}/api/analytics/form/${formId}`);
            const responses = res.data.responses || [];

            const timelineMap = {};
            responses.forEach(r => {
                const dateObj = new Date(r.date);
                const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                timelineMap[date] = (timelineMap[date] || 0) + 1;
            });

            const timelineData = Object.entries(timelineMap)
                .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                .map(([date, count]) => ({ date, count }));

            setStats({ ...res.data, formId, timelineData });
            setActiveTab('analytics');
            setAnalyticsView('charts');
        } catch (err) {
            console.error(err);
            toast.error("Could not load analytics");
        }
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

    return (
        <div className="min-h-screen bg-gray-50/50 flex overflow-hidden font-sans text-gray-800">
            {/* --- Sidebar --- */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: isSidebarOpen ? 0 : -280 }}
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 lg:static lg:translate-x-0 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}
            >
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center gap-3 px-2 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                            FS
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Feed Back
                        </span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <SidebarBtn
                            active={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                            icon={LayoutDashboard}
                            label="Dashboard"
                        />
                        {user?.role === 'Admin' ? (
                            <>
                                <SidebarBtn
                                    active={activeTab === 'forms'}
                                    onClick={() => setActiveTab('forms')}
                                    icon={FileText}
                                    label="Forms Manager"
                                />
                                {stats && (
                                    <SidebarBtn
                                        active={activeTab === 'analytics'}
                                        onClick={() => setActiveTab('analytics')}
                                        icon={Activity}
                                        label="Live Analytics"
                                        badge="Active"
                                    />
                                )}
                            </>
                        ) : (
                            <SidebarBtn
                                active={activeTab === 'history'}
                                onClick={() => setActiveTab('history')}
                                icon={History}
                                label="My History"
                            />
                        )}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-white shadow-sm">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                            </div>
                            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* --- Main Content --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-4 sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                    <span className="font-bold text-gray-900">InsightFlow</span>
                    <div className="w-8" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Header Section */}
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {activeTab === 'overview' ? 'Overview' :
                                        activeTab === 'forms' ? 'Forms Manager' :
                                            activeTab === 'analytics' ? 'Analytics Dashboard' : 'My History'}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    {activeTab === 'analytics'
                                        ? `Deep dive into "${stats?.formTitle}"`
                                        : `Welcome back, ${user?.name.split(' ')[0]}`
                                    }
                                </p>
                            </div>
                            {(activeTab === 'overview' || activeTab === 'forms') && user?.role === 'Admin' && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl shadow-lg shadow-gray-200 transition-all hover:-translate-y-0.5"
                                >
                                    <PlusCircle size={20} />
                                    <span>New Form</span>
                                </button>
                            )}
                        </header>

                        <AnimatePresence mode="wait">
                            {/* --- Admin Overview --- */}
                            {user?.role === 'Admin' && activeTab === 'overview' && (
                                <motion.div
                                    key="admin-overview"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard
                                            title="Total Forms"
                                            value={adminForms.length}
                                            subtext="Lifetime created"
                                            icon={FileText}
                                            color="text-blue-600 bg-blue-600"
                                            delay={0}
                                        />
                                        <StatCard
                                            title="Active Campaigns"
                                            value={adminForms.filter(f => f.isActive).length}
                                            subtext="Currently collecting"
                                            icon={Activity}
                                            color="text-emerald-600 bg-emerald-600"
                                            delay={0.1}
                                        />
                                        <StatCard
                                            title="Total Responses"
                                            value={adminForms.reduce((acc, curr) => acc + (curr.responseCount || 0), 0) + "+"}
                                            subtext="Across all forms"
                                            icon={MessageSquare}
                                            color="text-purple-600 bg-purple-600"
                                            delay={0.2}
                                        />
                                        <StatCard
                                            title="Avg Engagement"
                                            value="~76%"
                                            subtext="Completion rate"
                                            icon={TrendingUp}
                                            color="text-orange-600 bg-orange-600"
                                            delay={0.3}
                                        />
                                    </div>

                                    {/* Recent Activity / Forms List Table */}
                                    <Card delay={0.4} className="overflow-hidden p-0">
                                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                            <h3 className="font-semibold text-gray-900">Recent Forms</h3>
                                            <button onClick={() => setActiveTab('forms')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                                                View All <ChevronRight size={16} />
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Form Title</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {adminForms.slice(0, 5).map(form => (
                                                        <tr key={form._id} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="font-medium text-gray-900">{form.title}</div>
                                                                <div className="text-xs text-gray-500">{form.targetRoles.join(', ')}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {new Date(form.endDate).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge active={form.isActive} />
                                                            </td>
                                                            <td className="px-6 py-4 text-right space-x-2">
                                                                <button onClick={() => viewStats(form._id)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline">
                                                                    Analytics
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {/* --- Admin Forms Manager --- */}
                            {user?.role === 'Admin' && activeTab === 'forms' && (
                                <motion.div
                                    key="forms-manager"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <Card className="overflow-hidden p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Form Title</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Responses</th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {adminForms.map(form => (
                                                        <tr key={form._id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="font-medium text-gray-900">{form.title}</div>
                                                                <div className="text-xs text-gray-500 mt-1">{form.questions.length} questions</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {form.targetRoles.join(', ')}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {new Date(form.startDate).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {new Date(form.endDate).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge active={form.isActive} />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                                    {form.responseCount || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right space-x-3">
                                                                <button
                                                                    onClick={() => viewStats(form._id)}
                                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline"
                                                                >
                                                                    Analytics
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteForm(form._id)}
                                                                    className="text-red-600 hover:text-red-900 text-sm font-medium hover:underline"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {/* --- Admin Analytics Detail --- */}
                            {user?.role === 'Admin' && activeTab === 'analytics' && stats && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex gap-2">
                                            <TabButton active={analyticsView === 'charts'} onClick={() => setAnalyticsView('charts')} label="Visual Insights" />
                                            <TabButton active={analyticsView === 'responses'} onClick={() => setAnalyticsView('responses')} label="Raw Data" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {stats.attachedPdf && (
                                                <a
                                                    href={`${API}${stats.attachedPdf}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
                                                >
                                                    <FileText size={16} /> View PDF
                                                </a>
                                            )}
                                            <button onClick={() => exportReport(stats.formId)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm">
                                                <Download size={16} /> Export CSV
                                            </button>
                                        </div>
                                    </div>

                                    {analyticsView === 'charts' ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Key Metrics Row */}
                                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                                                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                                        <Users size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Total Responses</p>
                                                        <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                                                    </div>
                                                </Card>
                                                <Card className="flex items-center gap-4 border-l-4 border-l-purple-500">
                                                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                                                        <Activity size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Avg Sentiment</p>
                                                        <p className="text-2xl font-bold text-gray-900">{stats.averageSentiment}</p>
                                                    </div>
                                                </Card>
                                                <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500">
                                                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                                                        <CheckCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                                                        <p className="text-2xl font-bold text-gray-900">100%</p>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Charts */}
                                            <Card className="lg:col-span-3 h-96">
                                                <h3 className="font-bold text-gray-900 mb-6">Response Trends Over Time</h3>
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <AreaChart data={stats.timelineData || []}>
                                                        <defs>
                                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF0F4" />
                                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} allowDecimals={false} />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#1f2937' }}
                                                            labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                                                        />
                                                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </Card>

                                            <Card className="lg:col-span-3 h-[600px]">
                                                <h3 className="font-bold text-gray-900 mb-4">Question Performance Analysis</h3>
                                                <p className="text-sm text-gray-500 mb-6">Average ratings across all questions (hover for details)</p>
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <BarChart
                                                        data={Object.entries(stats.questionStats).map(([key, val]) => ({
                                                            name: key.length > 50 ? key.substring(0, 50) + '...' : key,
                                                            fullName: key,
                                                            rating: val.average,
                                                            responses: val.count
                                                        }))}
                                                        layout="vertical"
                                                        margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f3f4f6" opacity={0.1} />
                                                        <XAxis type="number" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                        <YAxis dataKey="name" type="category" width={350} tick={{ fontSize: 13, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(249, 250, 251, 0.05)' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px', backgroundColor: '#fff' }}
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    return (
                                                                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                                                                            <p className="font-semibold text-gray-900 text-sm mb-2">{payload[0].payload.fullName}</p>
                                                                            <p className="text-indigo-600 font-bold text-lg">★ {payload[0].value.toFixed(2)}</p>
                                                                            <p className="text-xs text-gray-400 mt-1">{payload[0].payload.responses} responses</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Bar dataKey="rating" radius={[0, 8, 8, 0]} barSize={28}>
                                                            {Object.entries(stats.questionStats).map((entry, index) => {
                                                                const rating = entry[1].average;
                                                                let color = '#10b981';
                                                                if (rating < 3) color = '#ef4444';
                                                                else if (rating < 4) color = '#f59e0b';
                                                                return <Cell key={`cell-${index}`} fill={color} />;
                                                            })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </Card>
                                        </div>
                                    ) : (
                                        <Card className="overflow-hidden p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Rating</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {stats.responses?.map((resp, idx) => (
                                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{resp.user}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{resp.role}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{resp.department}</td>
                                                                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{resp.avgRating}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(resp.date).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card>
                                    )}
                                </motion.div>
                            )}

                            {/* --- Student/User Dashboard --- */}
                            {user?.role !== 'Admin' && activeTab === 'overview' && (
                                <motion.div
                                    key="user-dash"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    {/* Welcome Banner */}
                                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                                        <div className="relative z-10 max-w-2xl">
                                            <h2 className="text-3xl font-bold mb-2 tracking-tight">Ready to shape the future?</h2>
                                            <p className="text-indigo-100 text-lg opacity-90">
                                                Your feedback drives real change. You have <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg">{activeForms.length}</span> active surveys waiting.
                                            </p>
                                        </div>
                                        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                                        <div className="absolute bottom-0 right-20 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl transform translate-y-1/2"></div>
                                    </div>

                                    {/* Forms Grid */}
                                    {activeForms.length === 0 ? (
                                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="text-green-500 w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                                            <p className="text-gray-500 mt-1">Check back later for new surveys.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {activeForms.map((form, i) => {
                                                const now = new Date();
                                                const endDate = new Date(form.endDate);
                                                const isExpired = now > endDate;
                                                const isCompleted = form.hasSubmitted;

                                                let statusColor = 'border-t-blue-500';
                                                let statusBadge = { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Pending' };
                                                let isClickable = true;

                                                if (isCompleted) {
                                                    statusColor = 'border-t-green-500';
                                                    statusBadge = { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' };
                                                    isClickable = false;
                                                } else if (isExpired) {
                                                    statusColor = 'border-t-red-500';
                                                    statusBadge = { bg: 'bg-red-50', text: 'text-red-700', label: 'Expired' };
                                                    isClickable = false;
                                                }

                                                return (
                                                    <Card
                                                        key={form._id}
                                                        delay={i * 0.1}
                                                        className={`flex flex-col h-full border-t-4 ${statusColor} ${isClickable ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-75 cursor-not-allowed'} transition-transform`}
                                                        onClick={() => isClickable && setSelectedForm(form)}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <span className={`px-3 py-1 ${statusBadge.bg} ${statusBadge.text} text-xs font-bold rounded-full uppercase tracking-wider`}>
                                                                    {statusBadge.label}
                                                                </span>
                                                                <span className={`text-xs font-semibold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
                                                                    <Calendar size={12} /> {new Date(form.endDate).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{form.title}</h3>
                                                            <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                                                                {form.description || "Your input matters. Please take a moment to provide your feedback."}
                                                            </p>
                                                        </div>
                                                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                                            <span className="text-xs font-medium text-gray-400">{form.questions.length} questions</span>
                                                            {isClickable ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedForm(form); }}
                                                                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                                >
                                                                    Start Survey <ChevronRight size={16} />
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-gray-400">
                                                                    {isCompleted ? '✓ Submitted' : '✕ Closed'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* --- User History --- */}
                            {user?.role !== 'Admin' && activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-8 py-6 border-b border-gray-100">
                                            <h3 className="font-bold text-gray-900 text-lg">Submission History</h3>
                                        </div>
                                        {userHistory.length === 0 ? (
                                            <div className="p-12 text-center text-gray-500">No submissions found.</div>
                                        ) : (
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Form Title</th>
                                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Submitted On</th>
                                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {userHistory.map(resp => (
                                                        <tr key={resp._id} className="hover:bg-gray-50">
                                                            <td className="px-8 py-4 text-sm font-medium text-gray-900">{resp.formId?.title || "Deleted Form"}</td>
                                                            <td className="px-8 py-4 text-sm text-gray-500">{new Date(resp.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-8 py-4">
                                                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Finished</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showCreateModal && <CreateFormModal onClose={() => setShowCreateModal(false)} onCreated={fetchAdminData} />}
            {selectedForm && (
                <FeedbackFormModal
                    form={selectedForm}
                    onClose={() => setSelectedForm(null)}
                    onSubmitSuccess={() => { fetchUserForms(); fetchUserHistory(); }}
                />
            )}
        </div>
    );
}

// --- Helper Components ---
const SidebarBtn = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
        <div className="flex items-center gap-3">
            <Icon size={20} className={`${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span>{label}</span>
        </div>
        {badge && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
);

const TabButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
    >
        {label}
    </button>
);

const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        {active ? 'Active' : 'Closed'}
    </span>
);
