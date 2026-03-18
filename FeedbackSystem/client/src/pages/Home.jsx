import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, Shield, Users, Zap } from "lucide-react";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white transition-colors duration-300">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
                        FS
                    </div>
                    <span className="text-xl font-bold text-gray-900">InsightFlow</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate("/register")}
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-all hover:scale-105 shadow-sm"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
                        <Zap size={14} /> Version 2.0 Now Live
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
                        Feedback that <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">drives impact.</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
                        Empower your institution with real-time insights. Collect, analyze, and act on feedback with our advanced analytics platform designed for modern education.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate("/register")}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-100"
                        >
                            Start Collecting <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => window.open('https://github.com', '_blank')}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                            View Demo
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-3xl opacity-20 transform translate-y-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80"
                        alt="Dashboard Preview"
                        className="relative rounded-2xl shadow-2xl border border-gray-200/50 grayscale-[20%]"
                    />
                    {/* Floating Card */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4 hidden md:flex"
                    >
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Analytics Ready</p>
                            <p className="text-xs text-gray-500">Real-time data visualization</p>
                        </div>
                    </motion.div>
                </motion.div>
            </main>

            {/* Features Grid */}
            <section className="bg-gray-50 py-24 transition-colors">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to grow</h2>
                        <p className="text-gray-500">Simplify feedback collection and gain actionable insights with our comprehensive suite of tools.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Users}
                            title="Role-Based Access"
                            desc="Tailored dashboards for Students, Teachers, and Admins ensuring the right data for everyone."
                        />
                        <FeatureCard
                            icon={BarChart2}
                            title="Advanced Analytics"
                            desc="Visualize trends with interactive charts, heatmaps, and AI-driven sentiment analysis."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Secure & Anonymous"
                            desc="Encrypted data transmission with options for anonymous feedback to encourage honesty."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

