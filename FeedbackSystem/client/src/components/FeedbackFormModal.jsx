import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Star, X, CheckCircle, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FeedbackFormModal = ({ form, onClose, onSubmitSuccess }) => {
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswerChange = (qIndex, value, questionText) => {
        setAnswers({
            ...answers,
            [qIndex]: { questionText, answer: value }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formattedAnswers = Object.values(answers);

        if (formattedAnswers.length !== form.questions.length) {
            toast.error("Please answer all questions");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/feedback/submit', {
                formId: form._id,
                answers: formattedAnswers
            });
            toast.success("Feedback Submitted!");
            onSubmitSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 transition-colors duration-300"
                >
                    <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{form.title}</h2>
                            <p className="text-indigo-100 mt-1 text-sm opacity-90">{form.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {form.attachedPdf && (
                            <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Reference Material</h3>
                                        <p className="text-sm text-gray-500">Review the attached document if needed.</p>
                                    </div>
                                </div>
                                <a
                                    href={`http://localhost:5000${form.attachedPdf}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-indigo-600 font-bold border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm"
                                >
                                    <Download size={18} /> View PDF
                                </a>
                            </div>
                        )}
                        <form id="feedback-form" onSubmit={handleSubmit} className="space-y-10">
                            {form.questions.map((q, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="space-y-4"
                                >
                                    <label className="block text-xl font-bold text-gray-900 leading-tight">
                                        <span className="text-indigo-500 mr-2 font-black">0{idx + 1}.</span>
                                        {q.questionText}
                                    </label>

                                    <div className="ml-0 md:ml-8">
                                        {q.questionType === 'Star' && (
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button"
                                                        onClick={() => handleAnswerChange(idx, star, q.questionText)}
                                                        className={`p-2.5 rounded-2xl transition-all transform hover:scale-110 ${answers[idx]?.answer >= star
                                                            ? 'text-yellow-400 bg-yellow-50'
                                                            : 'text-gray-200 hover:text-gray-300 hover:bg-gray-50'}`}>
                                                        <Star className={`w-9 h-9 ${answers[idx]?.answer >= star ? 'fill-current' : 'fill-none'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {q.questionType === 'YesNo' && (
                                            <div className="flex gap-4">
                                                {['Yes', 'No'].map(opt => (
                                                    <label key={opt} className={`flex-1 flex items-center justify-center px-8 py-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm ${answers[idx]?.answer === opt
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-4 ring-indigo-100'
                                                        : 'border-gray-100 text-gray-500 hover:border-indigo-200 hover:bg-gray-50'
                                                        }`}>
                                                        <input type="radio" name={`q-${idx}`} value={opt}
                                                            onChange={(e) => handleAnswerChange(idx, e.target.value, q.questionText)}
                                                            className="sr-only" />
                                                        <span className="text-lg">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.questionType === 'MultipleChoice' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {q.options && q.options.map((opt, i) => (
                                                    <label key={i} className={`flex items-center p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${answers[idx]?.answer === opt
                                                        ? 'border-indigo-600 bg-indigo-50 shadow-md transform -translate-y-0.5'
                                                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}>
                                                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${answers[idx]?.answer === opt ? 'border-indigo-600' : 'border-gray-200'
                                                            }`}>
                                                            {answers[idx]?.answer === opt && <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />}
                                                        </div>
                                                        <input type="radio" name={`q-${idx}`} value={opt}
                                                            onChange={(e) => handleAnswerChange(idx, e.target.value, q.questionText)}
                                                            className="sr-only" />
                                                        <span className={`text-lg ${answers[idx]?.answer === opt ? 'text-indigo-900 font-bold' : 'text-gray-700 font-medium'}`}>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.questionType === 'Text' && (
                                            <textarea
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg shadow-inner"
                                                rows="4"
                                                onChange={(e) => handleAnswerChange(idx, e.target.value, q.questionText)}
                                                placeholder="Share your detailed thoughts or suggestions here..."
                                            ></textarea>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </form>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="feedback-form"
                            disabled={isSubmitting}
                            className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? 'Submitting Responses...' : 'Post Feedback'}
                            {!isSubmitting && <CheckCircle className="h-5 w-5" />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FeedbackFormModal;
