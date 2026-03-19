import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const API = "https://centralised-feedback-system.onrender.com";
//const API = "http://localhost:5000";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
    LogOut, PlusCircle, CheckCircle, LayoutDashboard, FileText, Settings, Menu, X,
    Trash2, Download, TrendingUp, History, Users, MessageSquare, Calendar, ChevronRight, Activity,
    ChevronDown, ChevronUp, Clock, Target, Sparkles, Bell, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CreateFormModal from '../components/CreateFormModal';
import FeedbackFormModal from '../components/FeedbackFormModal';
import Chatbot from '../components/Chatbot';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [analyticsView, setAnalyticsView] = useState('charts');
    const [notifications, setNotifications] = useState([]);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API}/api/notifications`);
            setNotifications(res.data);
        } catch (error) { console.error("Failed to load notifications"); }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            if (user.role === 'Admin') {
                fetchAdminData();
            } else {
                fetchUserForms();
                fetchUserHistory();
            }
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API}/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) { console.error(error); }
    };

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
            {/* --- Sidebar Backdrop --- */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* --- Sidebar --- */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
            >
                <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between px-2 mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                                FS
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                Feed Back
                            </span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <SidebarBtn
                            active={activeTab === 'overview'}
                            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
                            icon={LayoutDashboard}
                            label="Dashboard"
                        />
                        {user?.role === 'Admin' ? (
                            <>
                                <SidebarBtn
                                    active={false}
                                    onClick={() => { setShowCreateModal(true); setIsSidebarOpen(false); }}
                                    icon={PlusCircle}
                                    label="Create Form"
                                />
                                <SidebarBtn
                                    active={activeTab === 'forms'}
                                    onClick={() => { setActiveTab('forms'); setIsSidebarOpen(false); }}
                                    icon={FileText}
                                    label="Forms Manager"
                                />
                                {stats && (
                                    <SidebarBtn
                                        active={activeTab === 'analytics'}
                                        onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
                                        icon={Activity}
                                        label="Live Analytics"
                                        badge="Active"
                                    />
                                )}
                            </>
                        ) : (
                            <SidebarBtn
                                active={activeTab === 'history'}
                                onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
                                icon={History}
                                label="My History"
                            />
                        )}
                        <SidebarBtn
                            active={activeTab === 'notifications'}
                            onClick={() => { setActiveTab('notifications'); setIsSidebarOpen(false); }}
                            icon={Bell}
                            label="Notifications"
                            badge={notifications.filter(n => !n.isRead).length > 0 ? (
                                <span className="flex h-2.5 w-2.5 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            ) : null}
                        />
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-white shadow-sm shrink-0">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                            </div>
                            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-4 sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <Menu />
                    </button>
                    <span className="font-bold text-gray-900">Feed Back</span>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Header Section */}
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {activeTab === 'overview' ? 'Overview' :
                                        activeTab === 'forms' ? 'Forms Manager' :
                                            activeTab === 'analytics' ? 'Analytics Dashboard' : 
                                                activeTab === 'notifications' ? 'Notifications' : 'My History'}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    {activeTab === 'analytics'
                                        ? `Deep dive into "${stats?.formTitle}"`
                                        : activeTab === 'notifications' ? 'Stay updated and communicate' 
                                        : `Welcome back, ${user?.name.split(' ')[0]}`
                                    }
                                </p>
                            </div>
                            {(activeTab === 'forms') && user?.role === 'Admin' && (
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

                                    {/* Detailed Visualizations */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                        
                                        {/* 1. Form Status Pie */}
                                        <Card className="flex flex-col items-center justify-center p-5 h-80 hover:shadow-lg transition-shadow">
                                            <h3 className="font-bold text-gray-900 w-full text-left mb-2">Form Status</h3>
                                            <p className="text-xs text-gray-400 w-full text-left mb-4">Active vs Inactive forms</p>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Active', value: adminForms.filter(f => f.isActive).length },
                                                            { name: 'Inactive', value: adminForms.length - adminForms.filter(f => f.isActive).length }
                                                        ]}
                                                        cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#e5e7eb" />
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Card>

                                        {/* 2. Responses by Form Bar */}
                                        <Card className="flex flex-col justify-center p-5 h-80 hover:shadow-lg transition-shadow">
                                            <h3 className="font-bold text-gray-900 w-full text-left mb-2">Top Forms</h3>
                                            <p className="text-xs text-gray-400 w-full text-left mb-6">By total responses</p>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[...adminForms].sort((a,b) => (b.responseCount||0) - (a.responseCount||0)).slice(0, 4)} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="title" tickFormatter={(v) => typeof v === 'string' && v.length > 8 ? v.substring(0,8)+'...' : v} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }} />
                                                    <Bar dataKey="responseCount" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Card>

                                        {/* 3. Avg Engagement Gauge */}
                                        <Card className="flex flex-col items-center justify-center p-5 h-80 hover:shadow-lg transition-shadow">
                                            <h3 className="font-bold text-gray-900 w-full text-left mb-2">Avg Engagement</h3>
                                            <p className="text-xs text-gray-400 w-full text-left mb-6">Overall completion rate</p>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadialBarChart 
                                                    cx="50%" cy="60%" innerRadius="75%" outerRadius="100%" // Shifted CY down for half circle
                                                    barSize={20} data={[{ name: 'Engagement', value: 76, fill: '#f59e0b' }]}
                                                    startAngle={180} endAngle={0}
                                                >
                                                    <RadialBar background clockWise dataKey="value" cornerRadius={12} />
                                                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 font-black text-4xl">
                                                        76%
                                                    </text>
                                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }} />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    </div>
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
                                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                                                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                                        <Users size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Responses</p>
                                                        <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                                                    </div>
                                                </Card>
                                                <Card className="flex items-center gap-4 border-l-4 border-l-purple-500">
                                                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                                                        <Target size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Total Targeted</p>
                                                        <p className="text-2xl font-bold text-gray-900">{stats.totalTargeted || 0}</p>
                                                    </div>
                                                </Card>
                                                <Card className="flex items-center gap-4 border-l-4 border-l-orange-500">
                                                    <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                                                        <Clock size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Pending</p>
                                                        <p className="text-2xl font-bold text-gray-900">{Math.max(0, (stats.totalTargeted || 0) - stats.totalResponses)}</p>
                                                    </div>
                                                </Card>
                                                <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500">
                                                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                                                        <CheckCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {stats.totalTargeted ? Math.min(100, Math.round((stats.totalResponses / stats.totalTargeted) * 100)) + '%' : (stats.totalResponses > 0 ? '100%' : '0%')}
                                                        </p>
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

                                            {/* Question Perf Analysis */}
                                            <div className="lg:col-span-3 mt-6 space-y-6">
                                                <h3 className="font-bold text-gray-900 text-xl border-b border-gray-200 pb-3 flex items-center gap-2">
                                                    <Activity className="text-indigo-600"/> Question Performance Analysis
                                                </h3>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {Object.entries(stats.questionStats).map(([qText, qData], idx) => {
                                                        const isStar = qData.type === 'Star';
                                                        const isChoice = qData.type === 'MultipleChoice' || qData.type === 'YesNo';
                                                        const isText = qData.type === 'Text';

                                                        let chartData = [];
                                                        if (isStar) {
                                                            chartData = [1, 2, 3, 4, 5].map(s => ({ name: `${s} Star`, count: qData.distribution[s] || 0 }));
                                                        } else if (isChoice) {
                                                            chartData = Object.keys(qData.distribution).map(k => ({ name: k, count: qData.distribution[k] }));
                                                        }

                                                        return (
                                                            <Card key={idx} className="h-auto flex flex-col hover:shadow-lg transition-shadow">
                                                                <h4 className="font-bold text-gray-800 text-base mb-2 leading-snug">{qText}</h4>
                                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-500">{qData.type}</span>
                                                                    {isStar && <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Avg: {qData.average || 0} ★</span>}
                                                                    <span className="text-xs text-gray-400 font-medium">{qData.count} responses</span>
                                                                </div>

                                                                {(isStar || isChoice) && chartData.length > 0 && (
                                                                    <div className="flex-1 min-h-[220px] w-full mt-2">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(value) => typeof value === 'string' && value.length > 15 ? value.substring(0, 15) + '...' : value} />
                                                                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                                                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px -1px rgba(0,0,0,0.1)' }} />
                                                                                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                                                                    {chartData.map((entry, index) => {
                                                                                        let fillColor = '#6366f1';
                                                                                        if (isStar) {
                                                                                            const starVal = parseInt(entry.name);
                                                                                            if (starVal < 3) fillColor = '#ef4444';
                                                                                            else if (starVal === 3) fillColor = '#f59e0b';
                                                                                            else fillColor = '#10b981';
                                                                                        } else if (qData.type === 'YesNo') {
                                                                                            if (entry.name === 'Yes') fillColor = '#10b981';
                                                                                            if (entry.name === 'No') fillColor = '#ef4444';
                                                                                        }
                                                                                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                                                                                    })}
                                                                                </Bar>
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                )}

                                                                {isText && qData.textAnswers.length > 0 && (
                                                                    <div className="mt-2 flex-1 flex flex-col">
                                                                        <div className="max-h-[160px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                                                            {qData.textAnswers.map((ans, aIdx) => (
                                                                                <div key={aIdx} className="bg-gray-50/80 p-3 rounded-lg text-sm text-gray-700 border border-gray-100">{ans}</div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="mt-3">
                                                                            <GeminiAnalysis answers={qData.textAnswers} questionText={qText} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {isText && qData.textAnswers.length === 0 && (
                                                                    <div className="text-sm text-gray-400 italic flex-1 flex items-center justify-center min-h-[100px] bg-gray-50 rounded-lg">No text responses yet.</div>
                                                                )}
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </div>
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
                                                            <ExpandableRow key={idx} resp={resp} />
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

                            {/* --- Notifications Tab --- */}
                            {activeTab === 'notifications' && (
                                <motion.div key="notifications-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {user?.role === 'Admin' && (
                                        <div className="flex justify-end mb-4">
                                            <button onClick={() => setShowBroadcastModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all shadow-indigo-200">
                                                <Send size={18} /> Send Broadcast
                                            </button>
                                        </div>
                                    )}
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                            <p className="text-gray-500 font-medium">You have no notifications right now.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-w-4xl mx-auto">
                                            {notifications.map(n => (
                                                <div key={n._id} onClick={() => !n.isRead && markAsRead(n._id)} className={`p-5 rounded-2xl border transition-all ${!n.isRead ? 'cursor-pointer bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 relative'}`}>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1">
                                                            <h4 className={`font-bold text-base flex items-center gap-2 ${n.isRead ? 'text-gray-800' : 'text-indigo-900'}`}>
                                                                {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm flex-shrink-0"></span>}
                                                                {n.title}
                                                            </h4>
                                                            <p className={`mt-2 text-sm leading-relaxed ${n.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-bold tracking-tight whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">{new Date(n.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
            {showBroadcastModal && <BroadcastModal onClose={() => setShowBroadcastModal(false)} onSent={fetchNotifications} API={API} />}
            {user?.role !== 'Admin' && <Chatbot />}
        </div>
    );
}

// --- Helper Components ---
const BroadcastModal = ({ onClose, onSent, API }) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [targetRoles, setTargetRoles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const roles = ['Student', 'Alumni', 'Teacher', 'Parent', 'Staff', 'Recruiter'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${API}/api/notifications/create`, {
                title, message, targetRoles
            });
            toast.success("Broadcast sent!");
            onSent();
            onClose();
        } catch (error) {
            toast.error("Failed to send broadcast");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 z-10 border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900 border-b pb-4"><Send className="text-indigo-600"/> Broadcast Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Announcement Title</label>
                            <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Server Maintenance Notice" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Message Body</label>
                            <textarea required rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all custom-scrollbar" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your full announcement here..." />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience <span className="text-gray-400 font-normal italic">(Leave empty for Global)</span></label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(r => (
                                    <button type="button" key={r} onClick={() => setTargetRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${targetRoles.includes(r) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
                                {isSubmitting ? 'Sending...' : 'Send Broadcast'}
                                {!isSubmitting && <Send size={16} />}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ExpandableRow = ({ resp }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <tr onClick={() => setExpanded(!expanded)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${expanded ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-3">
                    <div className="text-gray-400 hover:text-indigo-600">
                        {expanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </div>
                    {resp.user}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{resp.role}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{resp.department}</td>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{resp.avgRating}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(resp.date).toLocaleDateString()}</td>
            </tr>
            <AnimatePresence>
                {expanded && (
                    <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <td colSpan={5} className="bg-gray-50/80 p-6 border-b border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resp.answers?.map((ans, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <p className="text-xs text-gray-500 font-bold mb-2 break-words">Q: {ans.questionText}</p>
                                        <div className="text-sm text-gray-900 font-medium break-words bg-indigo-50/50 p-2 rounded-lg inline-block w-full">
                                            A: {ans.answer && ans.answer !== '' ? ans.answer : <span className="text-gray-400 italic">No answer</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    );
};

const GeminiAnalysis = ({ answers, questionText }) => {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Automatically use the API key and model from env if available
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

    const handleAnalyze = async () => {
        if (!answers || answers.length === 0) return;
        if (!API_KEY) {
            toast.error("VITE_GEMINI_API_KEY is missing in client/.env");
            return;
        }
        setLoading(true);
        try {
            const prompt = `You are an expert data analyst. Please write a 4 to 5 line summary analysis of the following unstructured user feedback responses for the question: "${questionText}". Be objective and extract the key themes.\n\nResponses:\n${answers.join('\n')}`;
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                }
            );
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate analysis at this time.';
            setAnalysis(text);
        } catch (e) {
            console.error(e);
            setAnalysis('An error occurred during formulation of the analysis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex-1 flex flex-col justify-center">
            {!analysis && !loading ? (
                <button onClick={handleAnalyze} className="w-full flex items-center justify-center gap-2 text-indigo-700 font-bold text-sm bg-white hover:bg-gray-50 transition-colors px-4 py-2 rounded-lg shadow-sm border border-indigo-200">
                    <Sparkles size={16} className="text-indigo-500" /> Auto-Analyze with Gemini AI
                </button>
            ) : loading ? (
                 <div className="flex justify-center flex-col gap-2 items-center text-indigo-500 text-sm font-semibold">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Responses...</span>
                 </div>
            ) : (
                 <div className="text-sm text-gray-800 leading-relaxed">
                     <div className="text-indigo-700 font-bold mb-2 flex items-center gap-1.5 pb-2 border-b border-indigo-100">
                         <Sparkles size={16}/> Gemini AI Analysis Insights:
                     </div>
                     <div className="prose prose-sm prose-indigo" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
                 </div>
            )}
        </div>
    );
};

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
