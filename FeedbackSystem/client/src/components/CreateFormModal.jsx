import { useState } from "react";
import axios from "axios";
const API = "https://centralised-feedback-system.onrender.com";
import toast from "react-hot-toast";
import { Trash2, X, Plus, Calendar, Users, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CreateFormModal = ({ onClose, onCreated }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetRoles, setTargetRoles] = useState([]);
    const [targetDepartments, setTargetDepartments] = useState([]);
    const [targetYears, setTargetYears] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [questions, setQuestions] = useState([{ questionText: "", questionType: "Star" }]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { questionText: "", questionType: "Star" }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("targetRoles", JSON.stringify(targetRoles));
            formData.append("targetDepartments", JSON.stringify(targetDepartments));
            formData.append("targetYears", JSON.stringify(targetYears));
            formData.append("startDate", startDate);
            formData.append("endDate", endDate);
            formData.append("questions", JSON.stringify(questions));
            if (pdfFile) {
                formData.append("pdfFile", pdfFile);
            }

            await axios.post(`${API}/api/feedback/create`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Feedback Form Created");
            onCreated();
            onClose();
        } catch (error) {
            toast.error("Failed to create form");
        }
    };

    const roles = ['Student', 'Alumni', 'Teacher', 'Parent', 'Staff', 'Recruiter'];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-xl font-bold text-gray-900">Create Feedback Form</h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <form id="create-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g., Spring Semester Course Eval"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Provide context for this feedback form..."
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Optional Reference Material (PDF)</label>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={(e) => setPdfFile(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50/30 p-5 rounded-2xl border border-gray-100 space-y-5">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-500" /> Target Audience
                                </h3>

                                {/* Roles */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map(role => (
                                            <button
                                                type="button"
                                                key={role}
                                                onClick={() => setTargetRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${targetRoles.includes(role)
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-400'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Departments */}
                                {targetRoles.some(r => ['Student', 'Teacher'].includes(r)) && (
                                    <>
                                        <div className="pt-4 border-t border-gray-200/50">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                                                Departments <span className="text-gray-400 font-normal normal-case italic">(Optional: Select none for All)</span>
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Business'].map(dept => (
                                                    <button
                                                        type="button"
                                                        key={dept}
                                                        onClick={() => setTargetDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])}
                                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${targetDepartments.includes(dept)
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-400'
                                                            }`}
                                                    >
                                                        {dept}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Years */}
                                        {targetRoles.includes('Student') && (
                                            <div className="pt-4 border-t border-gray-200/50">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                                                    Academic Years <span className="text-gray-400 font-normal normal-case italic">(Optional: Select none for All)</span>
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[1, 2, 3, 4].map(year => (
                                                        <button
                                                            type="button"
                                                            key={year}
                                                            onClick={() => setTargetYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year])}
                                                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${targetYears.includes(year)
                                                                ? 'bg-pink-600 text-white shadow-lg shadow-pink-200'
                                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-400'
                                                                }`}
                                                        >
                                                            {year === 1 ? '1st Year' : year === 2 ? '2nd Year' : year === 3 ? '3rd Year' : '4th Year'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" /> End Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Type className="h-4 w-4 text-indigo-500" /> Questions
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="text-sm text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" /> Add Question
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {questions.map((q, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-all"
                                        >
                                            <div className="flex gap-4 items-start">
                                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold mt-1 shadow-inner">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 space-y-4">
                                                    <input
                                                        type="text"
                                                        placeholder="What would you like to ask?"
                                                        required
                                                        className="w-full px-0 py-2 border-b-2 border-gray-100 focus:border-indigo-500 outline-none transition-colors bg-transparent placeholder-gray-300 font-medium text-lg"
                                                        value={q.questionText}
                                                        onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                                                    />

                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <select
                                                            className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                                            value={q.questionType}
                                                            onChange={(e) => handleQuestionChange(idx, 'questionType', e.target.value)}
                                                        >
                                                            <option value="Star">Star Rating (1-5)</option>
                                                            <option value="YesNo">Yes / No</option>
                                                            <option value="Text">Text Remark</option>
                                                            <option value="MultipleChoice">Multiple Choice</option>
                                                        </select>

                                                        {q.questionType === 'MultipleChoice' && (
                                                            <input
                                                                type="text"
                                                                placeholder="Option A, Option B..."
                                                                className="flex-1 text-sm px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                value={q.options ? q.options.join(', ') : ''}
                                                                onChange={(e) => handleQuestionChange(idx, 'options', e.target.value.split(',').map(o => o.trim()))}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQ = [...questions];
                                                        newQ.splice(idx, 1);
                                                        setQuestions(newQ);
                                                    }}
                                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all md:opacity-0 group-hover:opacity-100 shadow-sm md:shadow-none"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 transition-colors">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-form"
                            className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:transform active:scale-95"
                        >
                            Create Form
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateFormModal;
