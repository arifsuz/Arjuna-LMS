"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  courses as coursesApi,
  threads as threadsApi,
  academic as academicApi,
  type Course,
  type Thread,
} from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  Send,
  Sparkles,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  BookOpen,
  Video,
  FileText,
  Presentation,
  Link2,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Award,
  ShieldCheck,
  FileCheck,
  HelpCircle as QuizIcon,
  Bell,
  ExternalLink,
  Layers,
  CheckSquare,
  Square,
  TrendingUp,
  Download,
  X,
  Play,
  Zap,
} from "lucide-react";
import { BarChart, StatGauge, DonutChart } from "@/components/charts";

type ActiveTab =
  | "modules"
  | "threads"
  | "virtual"
  | "assignments"
  | "quizzes"
  | "gradebook"
  | "announcements";

const MATERIAL_ICON_MAP: Record<string, any> = {
  PDF: FileText,
  VIDEO: Video,
  SLIDE: Presentation,
  LINK: Link2,
  SCORM_H5P: Layers,
  DOCUMENT: FileText,
};

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat ruang perkuliahan...</div>}>
      <CourseDetailContent />
    </Suspense>
  );
}

function CourseDetailContent() {
  const { courseId } = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialTab = (searchParams.get("tab") as ActiveTab) || "modules";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as ActiveTab;
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab 1: Modules & Materials
  const [modulesData, setModulesData] = useState<{ modules: any[]; stats: any }>({
    modules: [],
    stats: { totalMaterials: 0, completedMaterials: 0, progressPercentage: 0 },
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>("");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialType, setNewMaterialType] = useState("PDF");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialDuration, setNewMaterialDuration] = useState(30);

  // Tab 2: Threads (ARJUNA Forum)
  const [threadList, setThreadList] = useState<Thread[]>([]);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);

  // Tab 3: Virtual Meetings
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingPlatform, setNewMeetingPlatform] = useState("GOOGLE_MEET");
  const [newMeetingUrl, setNewMeetingUrl] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingPasscode, setNewMeetingPasscode] = useState("");

  // Tab 4: Assignments & Quick Grading
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignDesc, setNewAssignDesc] = useState("");
  const [newAssignDue, setNewAssignDue] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Quick Grade Modal for Lecturer
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<any | null>(null);
  const [gradeScoreInput, setGradeScoreInput] = useState<number>(85);
  const [gradeFeedbackInput, setGradeFeedbackInput] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState<boolean>(false);

  // Tab 5: Quizzes
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuizToTake, setActiveQuizToTake] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Tab 5: Quiz Authoring (Lecturer & Admin)
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizDesc, setNewQuizDesc] = useState("");
  const [newQuizDuration, setNewQuizDuration] = useState(30);
  const [newQuizPassingScore, setNewQuizPassingScore] = useState(70);
  const [newQuizWeight, setNewQuizWeight] = useState(15);
  const [newQuizQuestions, setNewQuizQuestions] = useState<any[]>([
    {
      questionText: "",
      questionType: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      points: 10,
    },
  ]);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  // Tab 6: Gradebook & Early Warning
  const [gradebookData, setGradebookData] = useState<any | null>(null);

  // Tab 7: Announcements & Groups
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [showAddAnnounceModal, setShowAddAnnounceModal] = useState(false);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState("");
  const [newAnnounceContent, setNewAnnounceContent] = useState("");
  const [newAnnouncePriority, setNewAnnouncePriority] = useState("NORMAL");

  const loadAll = useCallback(async () => {
    try {
      const [
        courseData,
        threadsData,
        modulesRes,
        meetingsRes,
        assignmentsRes,
        quizzesRes,
        announcementsRes,
        groupsRes,
      ] = await Promise.all([
        coursesApi.getById(courseId),
        threadsApi.list(courseId),
        academicApi.getModules(courseId).catch(() => ({ modules: [], stats: {} })),
        academicApi.getMeetings(courseId).catch(() => []),
        academicApi.getAssignments(courseId).catch(() => []),
        academicApi.getQuizzes(courseId).catch(() => []),
        academicApi.getCourseAnnouncements(courseId).catch(() => []),
        academicApi.getStudyGroups(courseId).catch(() => []),
      ]);

      setCourse(courseData);
      setThreadList(threadsData.data || []);
      setModulesData(modulesRes);
      setMeetings(meetingsRes || []);
      setAssignments(assignmentsRes || []);
      setQuizzes(quizzesRes || []);
      setAnnouncements(announcementsRes || []);
      setStudyGroups(groupsRes || []);

      // Auto expand all modules
      const exp: Record<string, boolean> = {};
      modulesRes.modules?.forEach((m: any) => {
        exp[m.id] = true;
      });
      setExpandedModules(exp);
    } catch (err) {
      console.error("Gagal memuat detail kelas:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (activeTab === "gradebook") {
      academicApi.getGradebook(courseId).then(setGradebookData).catch(console.error);
    }
  }, [activeTab, courseId]);

  // Handler: Toggle Material Completion
  const handleToggleMaterial = async (materialId: string) => {
    try {
      await academicApi.toggleMaterialProgress(materialId);
      const updated = await academicApi.getModules(courseId);
      setModulesData(updated);
    } catch (err) {
      console.error("Gagal update progres materi:", err);
    }
  };

  // Handler: Create Thread (ARJUNA Forum)
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    setCreatingThread(true);
    try {
      await threadsApi.create(courseId, { title: newTitle, body: newBody });
      const threadsData = await threadsApi.list(courseId);
      setThreadList(threadsData.data || []);
      setShowNewThread(false);
      setNewTitle("");
      setNewBody("");
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingThread(false);
    }
  };

  // Handler: Add Module
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      await academicApi.createModule(courseId, {
        title: newModuleTitle,
        description: newModuleDesc,
      });
      setShowAddModuleModal(false);
      setNewModuleTitle("");
      setNewModuleDesc("");
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal membuat modul");
    }
  };

  // Handler: Add Material
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim() || !targetModuleId) return;
    try {
      await academicApi.createMaterial(targetModuleId, {
        title: newMaterialTitle,
        type: newMaterialType,
        contentUrl: newMaterialUrl,
        durationMinutes: Number(newMaterialDuration),
      });
      setShowAddMaterialModal(false);
      setNewMaterialTitle("");
      setNewMaterialUrl("");
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal menambah materi");
    }
  };

  // Handler: Schedule Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim() || !newMeetingUrl.trim() || !newMeetingDate) return;
    try {
      await academicApi.createMeeting(courseId, {
        title: newMeetingTitle,
        platform: newMeetingPlatform,
        meetingUrl: newMeetingUrl,
        scheduledAt: newMeetingDate,
        passcode: newMeetingPasscode || undefined,
      });
      setShowAddMeetingModal(false);
      setNewMeetingTitle("");
      setNewMeetingUrl("");
      setNewMeetingDate("");
      setNewMeetingPasscode("");
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal menjadwalkan kelas virtual");
    }
  };

  // Handler: Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignTitle.trim() || !newAssignDue) return;
    try {
      await academicApi.createAssignment(courseId, {
        title: newAssignTitle,
        description: newAssignDesc,
        dueDate: newAssignDue,
      });
      setShowAddAssignmentModal(false);
      setNewAssignTitle("");
      setNewAssignDesc("");
      setNewAssignDue("");
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal membuat tugas");
    }
  };

  // Handler: Submit Assignment
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionText.trim()) return;
    setSubmittingAssign(true);
    try {
      await academicApi.submitAssignment(selectedAssignment.id, {
        submittedText: submissionText,
        fileUrl: "https://cdn.arjuna-lms.ac.id/submissions/tugas-mandiri.pdf",
      });
      setSelectedAssignment(null);
      setSubmissionText("");
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal mengumpulkan tugas");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handler: Submit Quiz Attempt
  const handleSubmitQuizAttempt = async () => {
    if (!activeQuizToTake) return;
    setSubmittingQuiz(true);
    try {
      const answersPayload = Object.entries(quizAnswers).map(([qId, val]) => ({
        questionId: qId,
        selectedOptionIndex: typeof val === "number" ? val : undefined,
        essayAnswer: typeof val === "string" ? val : undefined,
      }));

      const res = await academicApi.submitQuizAttempt(activeQuizToTake.id, {
        answers: answersPayload,
      });

      setQuizResult(res);
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal mengirim jawaban kuis");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Handler: Create Quiz (Lecturer / Admin)
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    const validQuestions = newQuizQuestions
      .filter((q) => q.questionText.trim() !== "")
      .map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options:
          q.questionType === "MULTIPLE_CHOICE"
            ? q.options.filter((o: string) => o.trim() !== "")
            : [],
        correctOptionIndex: q.correctOptionIndex ?? 0,
        points: Number(q.points) || 10,
      }));

    if (validQuestions.length === 0) {
      alert("Harap tambahkan minimal 1 butir soal.");
      return;
    }

    setCreatingQuiz(true);
    try {
      await academicApi.createQuiz(courseId, {
        title: newQuizTitle,
        description: newQuizDesc || undefined,
        durationMinutes: Number(newQuizDuration) || 30,
        passingScore: Number(newQuizPassingScore) || 70,
        weightPercentage: Number(newQuizWeight) || 15,
        questions: validQuestions,
      });

      setShowAddQuizModal(false);
      setNewQuizTitle("");
      setNewQuizDesc("");
      setNewQuizQuestions([
        {
          questionText: "",
          questionType: "MULTIPLE_CHOICE",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          points: 10,
        },
      ]);
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal membuat kuis baru.");
    } finally {
      setCreatingQuiz(false);
    }
  };

  // Handler: Post Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle.trim() || !newAnnounceContent.trim()) return;
    try {
      await academicApi.createAnnouncement(courseId, {
        title: newAnnounceTitle,
        content: newAnnounceContent,
        priority: newAnnouncePriority,
        isPinned: true,
      });
      setShowAddAnnounceModal(false);
      setNewAnnounceTitle("");
      setNewAnnounceContent("");
      loadAll();
    } catch (err: any) {
      alert(err.message || "Gagal mengirim pengumuman");
    }
  };

  if (loading) {
    return (
      <div className="glass-card-static flex flex-col items-center justify-center py-28 rounded-3xl gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
        <span className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
          Menyiapkan Workspace Perkuliahan Terintegrasi...
        </span>
      </div>
    );
  }

  if (!course || !user) return null;

  const isLecturer = user.role === "LECTURER";
  const isStudent = user.role === "STUDENT";
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="glass-button-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#C9A05C]" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* 2. Course Hero Banner */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-[#C9A05C]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-xl border border-[#0A3266]/30 dark:border-[#C9A05C]/50 bg-[#0A3266]/10 dark:bg-[#0A3266]/40 px-3.5 py-1 text-xs font-black text-[#0A3266] dark:text-[#ebd09e]">
                {course.code}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Semester {course.term}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Kelas Aktif
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A3266] dark:text-white">
              {course.name}
            </h1>

            {course.description && (
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {course.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-400">Dosen Pengampu:</span>
                <span className="font-bold text-[#0A3266] dark:text-[#ebd09e]">
                  {course.lecturer?.name}
                </span>
              </div>
              <span className="text-slate-400">·</span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Users className="h-3.5 w-3.5 text-[#C9A05C]" />
                <span>{course._count?.enrollments || 4} Mahasiswa Terdaftar</span>
              </div>
            </div>
          </div>

          {/* Student Progress / Lecturer Metric Card */}
          {isStudent ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5 backdrop-blur-md min-w-[220px]">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 dark:text-slate-400">Progres Belajar Anda</span>
                <span className="text-[#8c6828] dark:text-[#ebd09e]">
                  {modulesData.stats?.progressPercentage || 0}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0A3266] to-[#C9A05C] transition-all duration-500"
                  style={{ width: `${modulesData.stats?.progressPercentage || 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                {modulesData.stats?.completedMaterials || 0} dari {modulesData.stats?.totalMaterials || 0} materi diselesaikan
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A05C]/20 text-[#C9A05C] border border-[#C9A05C]/40">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-black text-[#0A3266] dark:text-white">
                  {threadList.length} Thread Aktif
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {assignments.length} Tugas · {quizzes.length} Kuis
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 3. Standard Professional Campus LMS Classroom Structure (Sidebar + Workspace) ═══ */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* 3A. Left Course Sub-Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 glass-panel rounded-3xl p-5 shadow-xl space-y-5 lg:sticky lg:top-24 border border-black/10 dark:border-[#C9A05C]/20">
          <div className="space-y-4">
            {[
              {
                groupTitle: "Kurikulum & Modul",
                items: [
                  { id: "modules", label: "RPS & Modul Materi", icon: BookOpen },
                ],
              },
              {
                groupTitle: "Interaksi & Kuliah",
                items: [
                  { id: "threads", label: "Forum Diskusi ARJUNA", icon: MessageSquare, badge: threadList.length },
                  { id: "virtual", label: "Kuliah Tatap Muka (Meet)", icon: Video, badge: meetings.length },
                  { id: "announcements", label: "Pengumuman & Kelompok", icon: Bell, badge: announcements.length },
                ],
              },
              {
                groupTitle: "Tugas & Evaluasi",
                items: [
                  { id: "assignments", label: "Tugas & Turnitin", icon: FileCheck, badge: assignments.length },
                  { id: "quizzes", label: "Kuis & Ujian Daring", icon: QuizIcon, badge: quizzes.length },
                  { id: "gradebook", label: "Buku Nilai (Gradebook)", icon: GraduationCap },
                ],
              },
            ].map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]">
                  {group.groupTitle}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as ActiveTab)}
                        className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all text-left ${
                          isActive
                            ? "bg-[#C9A05C] text-[#0A3266] shadow-md ring-1 ring-[#C9A05C]/50"
                            : "text-slate-600 dark:text-[#ebd09e]/80 hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[#0A3266] dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                              isActive
                                ? "bg-[#0A3266] text-white"
                                : "bg-[#0A3266]/10 dark:bg-white/10 text-[#0A3266] dark:text-[#ebd09e]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 3B. Main Classroom Content Area */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: RPS & MODUL PEMBELAJARAN (LEARNING PATH)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "modules" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Syllabus & RPS Overview Card */}
          {course.syllabus && (
            <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-[#C9A05C]">
              <div className="flex items-center gap-2 mb-3 text-[#0A3266] dark:text-[#ebd09e] font-bold text-sm">
                <BookOpen className="h-4 w-4 text-[#C9A05C]" />
                <span>Rencana Pembelajaran Semester (RPS) & CPL</span>
              </div>
              <div
                className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: course.syllabus }}
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Daftar Bab & Alur Pembelajaran (Learning Path)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses slide kuliah, rekaman video, panduan praktikum, dan tandai penyelesaian materi.
              </p>
            </div>

            {(isLecturer || isAdmin) && (
              <button
                onClick={() => setShowAddModuleModal(true)}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Modul / Bab Baru</span>
              </button>
            )}
          </div>

          {/* Modules List */}
          <div className="space-y-4">
            {modulesData.modules.map((mod: any, idx: number) => {
              const isExpanded = expandedModules[mod.id] ?? true;

              return (
                <div
                  key={mod.id}
                  className="glass-panel overflow-hidden rounded-3xl border border-black/10 dark:border-[#C9A05C]/25 shadow-lg"
                >
                  {/* Module Header */}
                  <div
                    onClick={() =>
                      setExpandedModules({
                        ...expandedModules,
                        [mod.id]: !isExpanded,
                      })
                    }
                    className="flex cursor-pointer items-center justify-between p-5 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0A3266]/10 dark:bg-[#C9A05C]/20 text-[#0A3266] dark:text-[#C9A05C] font-mono text-xs font-black">
                        M{idx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0A3266] dark:text-white">
                          {mod.title}
                        </h3>
                        {mod.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-medium">
                        {mod.materials?.length || 0} Materi
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Materials Accordion Body */}
                  {isExpanded && (
                    <div className="p-5 pt-2 border-t border-black/5 dark:border-[#C9A05C]/15 space-y-3">
                      {mod.materials?.map((mat: any) => {
                        const Icon = MATERIAL_ICON_MAP[mat.type] || FileText;

                        return (
                          <div
                            key={mat.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 p-3.5 hover:border-[#C9A05C]/40 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C9A05C]/15 text-[#8c6828] dark:text-[#ebd09e]">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-[#0A3266] dark:text-slate-100">
                                  {mat.title}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className="font-semibold uppercase">{mat.type}</span>
                                  {mat.durationMinutes && (
                                    <>
                                      <span>·</span>
                                      <span>{mat.durationMinutes} menit</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {mat.contentUrl && (
                                <a
                                  href={mat.contentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="glass-button-secondary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                                >
                                  <ExternalLink className="h-3 w-3 text-[#C9A05C]" />
                                  <span>Buka Materi</span>
                                </a>
                              )}

                              {isStudent && (
                                <button
                                  onClick={() => handleToggleMaterial(mat.id)}
                                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                                    mat.isCompleted
                                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                                      : "border-black/10 dark:border-white/10 hover:bg-black/5 text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {mat.isCompleted ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                      <span>Selesai</span>
                                    </>
                                  ) : (
                                    <>
                                      <Square className="h-3.5 w-3.5" />
                                      <span>Tandai Selesai</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add material button for lecturer */}
                      {(isLecturer || isAdmin) && (
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setTargetModuleId(mod.id);
                              setShowAddMaterialModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c6828] dark:text-[#ebd09e] hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Materi pada {mod.title}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: FORUM ASINKRON (ARJUNA-NET RESEARCH CORE)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "threads" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Forum Diskusi Asinkron & Anotasi Afektif ARJUNA-Net
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wadah diskusi tanya jawab terstruktur, pengumpulan data emosi (5-classes), dan sentimen mahasiswa.
              </p>
            </div>

            <button
              onClick={() => setShowNewThread(true)}
              className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Buka Topik Pertanyaan Baru</span>
            </button>
          </div>

          {/* New Thread Modal */}
          {showNewThread && (
            <form
              onSubmit={handleCreateThread}
              className="glass-panel relative overflow-hidden rounded-3xl p-6 border-l-4 border-l-[#C9A05C] shadow-2xl animate-in fade-in"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Ajukan Pertanyaan / Topik Bahasan Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewThread(false)}
                  className="rounded-xl p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                    Judul Pertanyaan Diskusi
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Pemahaman Konsep Call Stack pada Fungsi Rekursif..."
                    required
                    className="glass-input w-full rounded-2xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                    Isi Pertanyaan & Studi Kasus
                  </label>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Jelaskan pertanyaan atau instruksi diskusi secara jelas..."
                    required
                    rows={4}
                    className="glass-input w-full resize-none rounded-2xl px-4 py-3 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewThread(false)}
                    className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingThread}
                    className="glass-button-primary flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold"
                  >
                    <Send className="h-3.5 w-3.5 text-[#C9A05C]" />
                    <span>{creatingThread ? "Membuka Diskusi..." : "Publikasikan Pertanyaan"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Threads List Cards */}
          <div className="space-y-3">
            {threadList.map((thread) => (
              <Link
                key={thread.id}
                href={`/dashboard/courses/${courseId}/threads/${thread.id}`}
                className="glass-card block rounded-3xl p-5 sm:p-6 transition-all hover:border-[#C9A05C]/50 hover:shadow-xl group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                          thread.initiatorRole === "LECTURER"
                            ? "bg-[#0A3266]/15 dark:bg-[#0A3266]/40 text-[#0A3266] dark:text-[#8bb8f0] border border-[#0A3266]/30"
                            : "bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e] border border-[#C9A05C]/40"
                        }`}
                      >
                        {thread.initiatorRole === "LECTURER" ? "Pertanyaan Dosen" : "Pertanyaan Mahasiswa"}
                      </span>

                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                          thread.status === "OPEN"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                        }`}
                      >
                        {thread.status === "OPEN" ? "Diskusi Terbuka" : "Ditutup"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0A3266] dark:text-white group-hover:text-[#8c6828] dark:group-hover:text-[#ebd09e] transition-colors">
                      {thread.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Oleh: <span className="font-semibold text-slate-700 dark:text-slate-300">{thread.initiator?.name}</span> · {new Date(thread.openedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <div className="font-bold text-[#0A3266] dark:text-white">
                        {thread._count?.messages || 0} Tanggapan
                      </div>
                      <div className="text-[11px] text-[#8c6828] dark:text-[#C9A05C]">
                        {thread._count?.opinions || 0} Refleksi Opini
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3: KELAS VIRTUAL (SYNCHRONOUS MEETINGS)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "virtual" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Ruang Kelas Virtual & Perkuliahan Sinkronus
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesi tatap muka daring melalui Google Meet, Zoom, atau Microsoft Teams.
              </p>
            </div>

            {(isLecturer || isAdmin) && (
              <button
                onClick={() => setShowAddMeetingModal(true)}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Jadwalkan Sesi Tatap Muka Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m: any) => (
              <div
                key={m.id}
                className="glass-card rounded-3xl p-6 flex flex-col justify-between border-l-4 border-l-blue-500"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-xl bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      {m.platform}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {m.durationMinutes} Menit
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                    {m.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <Calendar className="h-4 w-4 text-[#C9A05C]" />
                    <span>
                      {new Date(m.scheduledAt).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {m.passcode && (
                    <p className="mt-2 text-xs text-slate-500">
                      Passcode: <span className="font-mono font-bold text-[#0A3266] dark:text-white">{m.passcode}</span>
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button-primary flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-md w-full"
                  >
                    <Video className="h-4 w-4" />
                    <span>Gabung Perkuliahan Daring</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 4: TUGAS & PLAGIARISME (ASSIGNMENT DROPBOXES)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "assignments" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Manajemen Tugas & Pemeriksaan Anti-Plagiarisme (Turnitin)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengumpulan berkas tugas kuliah dengan skor keaslian dokumen dan penilaian dosen.
              </p>
            </div>

            {(isLecturer || isAdmin) && (
              <button
                onClick={() => setShowAddAssignmentModal(true)}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Tugas Kuliah Baru</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {assignments.map((a: any) => {
              const mySub = a.mySubmission;

              return (
                <div
                  key={a.id}
                  className="glass-card rounded-3xl p-6 border-l-4 border-l-amber-500 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-lg bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Bobot {a.weightPercentage}%
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Batas: {new Date(a.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                        {a.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {a.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isStudent && (
                        <div>
                          {mySub ? (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Sudah Dikumpulkan</span>
                              </span>
                              {mySub.score != null && (
                                <div className="mt-1 font-mono text-xs font-black text-[#8c6828] dark:text-[#ebd09e]">
                                  Nilai: {mySub.score} / {a.maxScore}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedAssignment(a)}
                              className="glass-button-gold rounded-xl px-4 py-2 text-xs font-bold shadow-md"
                            >
                              Kumpulkan Tugas
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Detail with Turnitin Badge (Student View) */}
                  {mySub && (
                    <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-4 text-xs space-y-3 border border-black/5 dark:border-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-bold text-[#0A3266] dark:text-[#ebd09e]">
                          Jawaban & Berkas Anda:
                        </span>
                        {mySub.plagiarismSimilarity != null && (
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>Turnitin Originality: {100 - mySub.plagiarismSimilarity}% Keaslian ({mySub.plagiarismSimilarity}% Similarity)</span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 italic">
                        &ldquo;{mySub.submittedText}&rdquo;
                      </p>
                      {mySub.feedback && (
                        <div className="pt-2 border-t border-black/5 dark:border-white/5 text-amber-700 dark:text-amber-300">
                          <strong>Umpan Balik Dosen:</strong> {mySub.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submissions List for Lecturer / Admin */}
                  {(isLecturer || isAdmin) && a.submissions && (
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#C9A05C]" />
                          <span>Daftar Pengumpulan Mahasiswa ({a.submissions.length})</span>
                        </span>
                      </div>

                      {a.submissions.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          Belum ada mahasiswa yang mengumpulkan tugas ini.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {a.submissions.map((sub: any) => (
                            <div
                              key={sub.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs border border-black/5 dark:border-white/5"
                            >
                              <div>
                                <div className="font-bold text-[#0A3266] dark:text-white">
                                  {sub.student?.name}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Dikumpulkan: {new Date(sub.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  {sub.plagiarismSimilarity != null && (
                                    <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                                      · Turnitin: {sub.plagiarismSimilarity}%
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {sub.score != null ? (
                                  <span className="rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    Nilai: {sub.score} / {a.maxScore}
                                  </span>
                                ) : (
                                  <span className="rounded-xl bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                    Belum Dinilai
                                  </span>
                                )}

                                <button
                                  onClick={() => {
                                    setSelectedSubmissionToGrade(sub);
                                    setGradeScoreInput(sub.score ?? 85);
                                    setGradeFeedbackInput(sub.feedback ?? "");
                                  }}
                                  className="glass-button-primary rounded-xl px-3 py-1 text-xs font-bold shadow-sm"
                                >
                                  {sub.score != null ? "Ubah Nilai" : "Beri Nilai"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 5: KUIS & UJIAN (QUIZ ENGINE)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "quizzes" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Mesin Kuis & Evaluasi Daring (Quiz Engine)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyusunan dan pengerjaan kuis pilihan ganda & esai dengan batas waktu serta penilaian otomatis.
              </p>
            </div>

            {(isLecturer || isAdmin) && (
              <button
                onClick={() => setShowAddQuizModal(true)}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Paket Kuis Baru</span>
              </button>
            )}
          </div>

          {quizzes.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-black/10 dark:border-[#C9A05C]/20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <HelpCircle className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-[#0A3266] dark:text-[#FBF8F3]">
                Belum Ada Paket Kuis Dibuat
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#ebd09e]/70 max-w-md mx-auto">
                {isLecturer || isAdmin
                  ? "Anda belum mempublikasikan paket kuis evaluasi untuk mata kuliah ini. Klik tombol di bawah untuk membuat kuis baru."
                  : "Dosen pengampu belum mempublikasikan kuis daring untuk kelas ini."}
              </p>
              {(isLecturer || isAdmin) && (
                <button
                  onClick={() => setShowAddQuizModal(true)}
                  className="glass-button-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg mt-5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Paket Kuis Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q: any) => {
                const myAtt = q.myAttempt;

                return (
                  <div
                    key={q.id}
                    className="glass-card rounded-3xl p-6 flex flex-col justify-between border-l-4 border-l-purple-500"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-xl bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          {q.questionsCount || q.questions?.length || 0} Soal · {q.durationMinutes} Menit
                        </span>
                        <span className="text-xs font-bold text-[#8c6828] dark:text-[#ebd09e]">
                          Passing: {q.passingScore}% · Bobot: {q.weightPercentage || 15}%
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                        {q.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {q.description || "Pengujian pemahaman materi bab perkuliahan."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                      {isStudent ? (
                        myAtt ? (
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              Skor: {myAtt.score} / 100 {myAtt.isPassed ? "(Lulus)" : "(Remedial)"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Belum Dikerjakan</span>
                        )
                      ) : (
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-300">
                          Kuis Aktif untuk Mahasiswa
                        </span>
                      )}

                      {isStudent && (
                        <button
                          onClick={async () => {
                            const details = await academicApi.getQuizDetails(q.id);
                            setActiveQuizToTake(details);
                            setQuizAnswers({});
                            setQuizResult(null);
                          }}
                          className="glass-button-gold rounded-xl px-4 py-2 text-xs font-bold shadow-md"
                        >
                          {myAtt ? "Kerjakan Ulang" : "Mulai Kerjakan Kuis"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 6: BUKU NILAI (GRADEBOOK) & EARLY WARNING SYSTEM
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "gradebook" && gradebookData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Gradebook Visual Analytics & Early Warning Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Grade Distribution Bar Chart */}
            <div className="md:col-span-2 glass-panel rounded-3xl p-6 border-l-4 border-l-[#C9A05C] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#0A3266] dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#C9A05C]" />
                    <span>Distribusi Huruf Mutu Mahasiswa</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    Rata-rata: {gradebookData.earlyWarningSummary?.averageClassScore || 0}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Sebaran capaian nilai akhir kelas (A s/d E)
                </p>
              </div>

              <BarChart
                data={[
                  { label: "A", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "A").length, color: "#10B981" },
                  { label: "AB", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "AB").length, color: "#3B82F6" },
                  { label: "B", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "B").length, color: "#C9A05C" },
                  { label: "BC", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "BC").length, color: "#F59E0B" },
                  { label: "C", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "C").length, color: "#6366F1" },
                  { label: "D", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "D").length, color: "#EC4899" },
                  { label: "E", value: (gradebookData.gradebook || []).filter((r: any) => r.letterGrade === "E").length, color: "#EF4444" },
                ]}
                height={120}
                valueSuffix=" Mhs"
              />
            </div>

            {/* Early Warning Risk Gauge */}
            <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-rose-500 flex flex-col justify-between items-center text-center">
              <div>
                <div className="flex items-center justify-between mb-1 w-full">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#ebd09e] flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Early Warning</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mahasiswa yang memerlukan asistensi
                </p>
              </div>

              <div className="py-2">
                <StatGauge
                  value={gradebookData.earlyWarningSummary?.totalAtRisk || 0}
                  maxValue={gradebookData.gradebook?.length || 4}
                  label="Mahasiswa At-Risk"
                  subLabel="Tugas / Forum Tertunda"
                  size={125}
                  unit=" Mhs"
                  statusBadge={gradebookData.earlyWarningSummary?.totalAtRisk > 0 ? "Perlu Tindakan" : "Kondisi Aman"}
                  statusType={gradebookData.earlyWarningSummary?.totalAtRisk > 0 ? "danger" : "success"}
                />
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Bobot: Tugas 20% · Kuis 15% · Forum 15% · UTS 25% · UAS 25%
              </p>
            </div>
          </div>

          {/* Gradebook Matrix Table */}
          <div className="glass-panel rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Rekapitulasi Nilai Akademik & Huruf Mutu (Gradebook)
              </h3>
              <span className="text-xs font-bold text-slate-400">
                Total {gradebookData.gradebook?.length || 0} Mahasiswa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-[#C9A05C]/20 bg-[#0A3266]/10 dark:bg-[#0A3266]/30 text-[#0A3266] dark:text-[#ebd09e] font-bold">
                    <th className="py-3 px-3">Nama Mahasiswa</th>
                    <th className="py-3 px-2 text-center">Tugas (20%)</th>
                    <th className="py-3 px-2 text-center">Kuis (15%)</th>
                    <th className="py-3 px-2 text-center">Forum (15%)</th>
                    <th className="py-3 px-2 text-center">UTS (25%)</th>
                    <th className="py-3 px-2 text-center">UAS (25%)</th>
                    <th className="py-3 px-2 text-center font-black">Total Skor</th>
                    <th className="py-3 px-2 text-center">Huruf Mutu</th>
                    <th className="py-3 px-3">Status / Early Warning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-[#C9A05C]/10 text-slate-700 dark:text-slate-200 font-medium">
                  {gradebookData.gradebook?.map((row: any) => (
                    <tr key={row.studentId} className="hover:bg-black/5 dark:hover:bg-white/[0.03]">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0A3266] dark:text-white">{row.studentName}</div>
                        <div className="text-[10px] text-slate-400">{row.studentEmail}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono">{row.assignmentScore}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.quizScore}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.forumScore}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.utsScore}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.uasScore}</td>
                      <td className="py-3 px-2 text-center font-mono font-black text-[#8c6828] dark:text-[#ebd09e] bg-[#C9A05C]/10">
                        {row.finalScore}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center justify-center h-6 w-8 rounded-lg bg-[#0A3266]/15 dark:bg-[#C9A05C]/20 font-black text-xs text-[#0A3266] dark:text-[#ebd09e]">
                          {row.letterGrade}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {row.isAtRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{row.riskReason}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{row.riskReason}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 7: PENGUMUMAN & KELOMPOK KERJA
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "announcements" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A3266] dark:text-white">
                Pengumuman Kelas & Grup Kerja Mahasiswa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informasi penting dari dosen pengampu dan daftar kelompok belajar.
              </p>
            </div>

            {(isLecturer || isAdmin) && (
              <button
                onClick={() => setShowAddAnnounceModal(true)}
                className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Announcements Feed (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              {announcements.map((a: any) => (
                <div
                  key={a.id}
                  className="glass-card rounded-3xl p-6 border-l-4 border-l-[#C9A05C] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      {a.priority === "URGENT" ? "PENTING / URGENT" : "INFORMASI"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0A3266] dark:text-white">
                    {a.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {a.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Study Groups (1 Col) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0A3266] dark:text-[#ebd09e] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C9A05C]" />
                <span>Kelompok Kerja Mahasiswa</span>
              </h3>

              {studyGroups.map((g: any) => (
                <div key={g.id} className="glass-panel rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-bold text-[#0A3266] dark:text-white">
                    {g.name}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {g.description}
                  </p>
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1">
                    {g.members?.map((m: any) => (
                      <div key={m.id} className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        • {m.student?.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: QUIZ PLAYER (COUNTDOWN TIMER & QUESTIONS)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeQuizToTake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A05C]/50 space-y-6">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c6828] dark:text-[#ebd09e]">
                  Ujian Daring Interaktif
                </span>
                <h3 className="text-lg font-black text-[#0A3266] dark:text-white">
                  {activeQuizToTake.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveQuizToTake(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quiz Result View */}
            {quizResult ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-black text-[#0A3266] dark:text-white">
                  Kuis Berhasil Dikirim!
                </h4>
                <div className="font-mono text-3xl font-black text-[#8c6828] dark:text-[#ebd09e]">
                  Skor: {quizResult.score} / 100
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quizResult.isPassed
                    ? "Selamat! Anda memenuhi batas nilai kelulusan minimal."
                    : "Skor di bawah passing grade. Anda dapat mempelajari modul terkait dan mencoba lagi."}
                </p>
                <button
                  onClick={() => {
                    setActiveQuizToTake(null);
                    setQuizResult(null);
                  }}
                  className="glass-button-primary rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg mt-4"
                >
                  Tutup & Kembali ke Kelas
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {activeQuizToTake.questions?.map((q: any, qIdx: number) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-[#0A3266] dark:text-[#ebd09e]">
                        Soal #{qIdx + 1} ({q.points} Poin)
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {q.questionText}
                    </p>

                    {/* Options (Multiple Choice) */}
                    {q.questionType === "MULTIPLE_CHOICE" && q.options && (
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt: string, optIdx: number) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              quizAnswers[q.id] === optIdx
                                ? "bg-[#C9A05C]/20 border-[#C9A05C] text-[#0A3266] dark:text-white"
                                : "border-black/10 dark:border-white/10 hover:bg-black/5 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() =>
                                setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })
                              }
                              className="accent-[#C9A05C]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Essay */}
                    {q.questionType === "ESSAY" && (
                      <textarea
                        rows={3}
                        value={(quizAnswers[q.id] as string) || ""}
                        onChange={(e) =>
                          setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })
                        }
                        placeholder="Tuliskan analisis jawaban esai Anda..."
                        className="glass-input w-full rounded-xl p-3 text-xs"
                      />
                    )}
                  </div>
                ))}

                <div className="flex justify-end gap-2 pt-4 border-t border-black/10 dark:border-[#C9A05C]/20">
                  <button
                    onClick={() => setActiveQuizToTake(null)}
                    className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitQuizAttempt}
                    disabled={submittingQuiz}
                    className="glass-button-gold rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg"
                  >
                    {submittingQuiz ? "Memeriksa Jawaban..." : "Kirim & Nilai Kuis"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: SUBMIT ASSIGNMENT DROPBOX
      ═══════════════════════════════════════════════════════════════════ */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleSubmitAssignment}
            className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Kumpulkan Tugas: {selectedAssignment.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Ringkasan Solusi / Teks Jawaban
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Tuliskan ringkasan hasil pengerjaan atau tautan repositori proyek Anda..."
                required
                rows={4}
                className="glass-input w-full rounded-2xl p-3 text-xs"
              />
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Sistem akan otomatis melakukan simulasi deteksi keaslian (Turnitin Similarity Index).</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingAssign}
                className="glass-button-gold rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                {submittingAssign ? "Mengunggah..." : "Kirim Tugas"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ADD MODULE (LECTURER)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleAddModule}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Tambah Modul / Bab Pembelajaran Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModuleModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Judul Modul / Pertemuan
              </label>
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Contoh: Minggu 05: Binary Search Tree & Kompleksitas"
                required
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Deskripsi Singkat Bab
              </label>
              <textarea
                value={newModuleDesc}
                onChange={(e) => setNewModuleDesc(e.target.value)}
                placeholder="Pokok bahasan yang akan dipelajari pada modul ini..."
                rows={3}
                className="glass-input w-full rounded-2xl p-3 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModuleModal(false)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="glass-button-primary rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                Simpan Modul
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ADD MATERIAL (LECTURER)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleAddMaterial}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Tambah Materi Multimedia Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Judul Materi
              </label>
              <input
                type="text"
                value={newMaterialTitle}
                onChange={(e) => setNewMaterialTitle(e.target.value)}
                placeholder="Contoh: Slide Kuliah & Teori Struktur Data"
                required
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Tipe Format
                </label>
                <select
                  value={newMaterialType}
                  onChange={(e) => setNewMaterialType(e.target.value)}
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="PDF">Dokumen / PDF</option>
                  <option value="SLIDE">Slide Presentasi</option>
                  <option value="VIDEO">Video Perkuliahan</option>
                  <option value="LINK">Tautan Eksternal</option>
                  <option value="SCORM_H5P">SCORM / H5P Interaktif</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Estimasi Durasi (Menit)
                </label>
                <input
                  type="number"
                  value={newMaterialDuration}
                  onChange={(e) => setNewMaterialDuration(Number(e.target.value))}
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                URL Berkas / Tautan Video
              </label>
              <input
                type="url"
                value={newMaterialUrl}
                onChange={(e) => setNewMaterialUrl(e.target.value)}
                placeholder="https://cdn.arjuna-lms.ac.id/materials/slide.pdf"
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="glass-button-primary rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                Simpan Materi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: SCHEDULE VIRTUAL MEETING (LECTURER)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleScheduleMeeting}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Jadwalkan Sesi Kuliah Tatap Muka Virtual
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMeetingModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Topik / Judul Pertemuan
              </label>
              <input
                type="text"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                placeholder="Contoh: Kuliah Sinkronus Minggu 5: Review Tugas & Diskusi"
                required
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Platform Konferensi
                </label>
                <select
                  value={newMeetingPlatform}
                  onChange={(e) => setNewMeetingPlatform(e.target.value)}
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="ZOOM">Zoom Meeting</option>
                  <option value="MS_TEAMS">Microsoft Teams</option>
                  <option value="JITSI">Jitsi Meet</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Waktu & Tanggal
                </label>
                <input
                  type="datetime-local"
                  value={newMeetingDate}
                  onChange={(e) => setNewMeetingDate(e.target.value)}
                  required
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Tautan Sesi Pertemuan (Meeting Link)
              </label>
              <input
                type="url"
                value={newMeetingUrl}
                onChange={(e) => setNewMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                required
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Passcode / Kunci Ruangan (Opsional)
              </label>
              <input
                type="text"
                value={newMeetingPasscode}
                onChange={(e) => setNewMeetingPasscode(e.target.value)}
                placeholder="ARJUNA2026"
                className="glass-input w-full rounded-2xl px-4 py-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMeetingModal(false)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="glass-button-primary rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                Jadwalkan Kuliah
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ADD ASSIGNMENT (LECTURER)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateAssignment}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Buat Tugas Kuliah Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAssignmentModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Judul Tugas
              </label>
              <input
                type="text"
                value={newAssignTitle}
                onChange={(e) => setNewAssignTitle(e.target.value)}
                placeholder="Contoh: Tugas 02: Analisis ERD & Normalisasi Database"
                required
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Tenggat Waktu (Deadline)
              </label>
              <input
                type="datetime-local"
                value={newAssignDue}
                onChange={(e) => setNewAssignDue(e.target.value)}
                required
                className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Petunjuk Pengerjaan & Format File
              </label>
              <textarea
                value={newAssignDesc}
                onChange={(e) => setNewAssignDesc(e.target.value)}
                placeholder="Jelaskan spesifikasi tugas, kriteria penilaian, dan batasan..."
                required
                rows={3}
                className="glass-input w-full rounded-2xl p-3 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAssignmentModal(false)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="glass-button-primary rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                Publikasikan Tugas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ADD ANNOUNCEMENT (LECTURER)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handlePostAnnouncement}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                Kirim Pengumuman Kelas
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAnnounceModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Judul Pengumuman
              </label>
              <input
                type="text"
                value={newAnnounceTitle}
                onChange={(e) => setNewAnnounceTitle(e.target.value)}
                placeholder="Contoh: Perubahan Jadwal Kuliah Pengganti"
                required
                className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Prioritas
              </label>
              <select
                value={newAnnouncePriority}
                onChange={(e) => setNewAnnouncePriority(e.target.value)}
                className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="NORMAL">Normal / Informasi</option>
                <option value="URGENT">Penting / Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Isi Pesan Pengumuman
              </label>
              <textarea
                value={newAnnounceContent}
                onChange={(e) => setNewAnnounceContent(e.target.value)}
                placeholder="Tuliskan pengumuman lengkap untuk seluruh mahasiswa kelas..."
                required
                rows={4}
                className="glass-input w-full rounded-2xl p-3 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAnnounceModal(false)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="glass-button-primary rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                Siarkan Pengumuman
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: QUICK GRADE SUBMISSION (LECTURER / ADMIN)
      ═══════════════════════════════════════════════════════════════════ */}
      {selectedSubmissionToGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingGrade(true);
              try {
                await academicApi.gradeSubmission(selectedSubmissionToGrade.id, {
                  score: Number(gradeScoreInput),
                  feedback: gradeFeedbackInput,
                });
                setSelectedSubmissionToGrade(null);
                loadAll();
              } catch (err: any) {
                alert("Gagal menyimpan nilai: " + (err.message || "Kesalahan server"));
              } finally {
                setSavingGrade(false);
              }
            }}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#C9A05C]/50 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Penilaian Berkas: {selectedSubmissionToGrade.student?.name}
                </h3>
                {selectedSubmissionToGrade.plagiarismSimilarity != null && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Turnitin Similarity: {selectedSubmissionToGrade.plagiarismSimilarity}% (Keaslian: {100 - selectedSubmissionToGrade.plagiarismSimilarity}%)
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Jawaban / Teks Tugas Mahasiswa:
              </label>
              <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] p-3 text-xs text-slate-700 dark:text-slate-200 max-h-36 overflow-y-auto italic border border-black/5 dark:border-white/5 leading-relaxed">
                &ldquo;{selectedSubmissionToGrade.submittedText}&rdquo;
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Skor Nilai Akhir (0 - 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeScoreInput}
                  onChange={(e) => setGradeScoreInput(Number(e.target.value))}
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                Umpan Balik / Catatan Dosen (Feedback):
              </label>
              <textarea
                rows={3}
                value={gradeFeedbackInput}
                onChange={(e) => setGradeFeedbackInput(e.target.value)}
                placeholder="Tuliskan umpan balik atau catatan evaluasi untuk mahasiswa..."
                className="glass-input w-full rounded-2xl p-3 text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingGrade}
                className="glass-button-primary rounded-xl px-5 py-2 text-xs font-bold shadow-lg"
              >
                {savingGrade ? "Menyimpan..." : "Simpan & Rilis Nilai"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ADD QUIZ & QUESTIONS (LECTURER / ADMIN)
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateQuiz}
            className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A05C]/50 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-[#C9A05C]/20 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c6828] dark:text-[#ebd09e]">
                  Evaluasi Daring
                </span>
                <h3 className="text-base font-bold text-[#0A3266] dark:text-white">
                  Buat Paket Kuis Perkuliahan Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddQuizModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quiz General Info */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Judul Kuis / Evaluasi *
                </label>
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="Contoh: Kuis 01: Logika Pemrograman & Kompleksitas"
                  required
                  className="glass-input w-full rounded-2xl px-4 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-[#ebd09e]">
                  Deskripsi / Petunjuk Pengerjaan
                </label>
                <textarea
                  value={newQuizDesc}
                  onChange={(e) => setNewQuizDesc(e.target.value)}
                  placeholder="Jelaskan cakupan materi bab, tata tertib pengerjaan, dan ketentuan kelulusan..."
                  rows={2}
                  className="glass-input w-full rounded-2xl p-3 text-xs"
                />
              </div>

              {/* 3 Columns Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-[#ebd09e]">
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newQuizDuration}
                    onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                    required
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-[#ebd09e]">
                    Passing Grade (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newQuizPassingScore}
                    onChange={(e) => setNewQuizPassingScore(Number(e.target.value))}
                    required
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-[#ebd09e]">
                    Bobot Penilaian (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newQuizWeight}
                    onChange={(e) => setNewQuizWeight(Number(e.target.value))}
                    required
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Question Builder */}
            <div className="space-y-4 pt-3 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A3266] dark:text-[#ebd09e]">
                  Daftar Butir Soal ({newQuizQuestions.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setNewQuizQuestions([
                      ...newQuizQuestions,
                      {
                        questionText: "",
                        questionType: "MULTIPLE_CHOICE",
                        options: ["", "", "", ""],
                        correctOptionIndex: 0,
                        points: 10,
                      },
                    ])
                  }
                  className="rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#C9A05C]/20 hover:text-[#C9A05C] px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Soal</span>
                </button>
              </div>

              <div className="space-y-4">
                {newQuizQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#0A3266] text-white px-2 py-0.5 text-[10px] font-bold">
                          Soal #{qIdx + 1}
                        </span>
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const updated = [...newQuizQuestions];
                            updated[qIdx].questionType = e.target.value;
                            setNewQuizQuestions(updated);
                          }}
                          className="glass-input rounded-lg px-2 py-1 text-[11px] font-semibold"
                        >
                          <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                          <option value="ESSAY">Esai / Jawaban Terbuka</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold">
                          <span>Poin:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...newQuizQuestions];
                              updated[qIdx].points = Number(e.target.value);
                              setNewQuizQuestions(updated);
                            }}
                            className="glass-input w-14 rounded-lg px-1.5 py-0.5 text-xs font-mono text-center"
                          />
                        </div>
                        {newQuizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewQuizQuestions(newQuizQuestions.filter((_, idx) => idx !== qIdx))
                            }
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/15 transition-colors"
                            title="Hapus Butir Soal"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...newQuizQuestions];
                          updated[qIdx].questionText = e.target.value;
                          setNewQuizQuestions(updated);
                        }}
                        placeholder={`Tuliskan teks pertanyaan soal nomor ${qIdx + 1}...`}
                        required
                        className="glass-input w-full rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    {/* Options if MULTIPLE_CHOICE */}
                    {q.questionType === "MULTIPLE_CHOICE" && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Pilihan Jawaban (Pilih radio button di kiri untuk kunci jawaban benar):
                        </span>
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_key_${qIdx}`}
                              checked={q.correctOptionIndex === optIdx}
                              onChange={() => {
                                const updated = [...newQuizQuestions];
                                updated[qIdx].correctOptionIndex = optIdx;
                                setNewQuizQuestions(updated);
                              }}
                              className="accent-[#C9A05C] h-4 w-4 shrink-0"
                              title="Set sebagai kunci jawaban benar"
                            />
                            <span className="font-mono text-xs font-bold text-slate-400 w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newQuizQuestions];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setNewQuizQuestions(updated);
                              }}
                              placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                              required
                              className="glass-input w-full rounded-lg px-2.5 py-1 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-black/10 dark:border-[#C9A05C]/20">
              <button
                type="button"
                onClick={() => setShowAddQuizModal(false)}
                className="glass-button-secondary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creatingQuiz}
                className="glass-button-primary rounded-xl px-6 py-2 text-xs font-bold shadow-lg"
              >
                {creatingQuiz ? "Menerbitkan Kuis..." : "💾 Terbitkan Paket Kuis"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
