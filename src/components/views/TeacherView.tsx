import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Flag,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  CourseRecord,
  CurriculumUnit,
  RosterStudent,
  StudentSubmission,
  TeacherTab,
  UnitStatus,
} from '../../types/academic';
import { ProgressRing } from '../ui/ProgressRing';
import { StatusIndicator } from '../ui/StatusIndicator';

interface TeacherViewProps {
  activeTab: TeacherTab;
  courses: CourseRecord[];
  units: CurriculumUnit[];
  submissions: StudentSubmission[];
  students: RosterStudent[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onToggleLessonComplete: (unitId: string, lessonId: string) => void;
  onUpdateUnitStatus: (unitId: string, status: UnitStatus) => void;
  onAddUnit: (unit: Omit<CurriculumUnit, 'id'>) => void;
  onSubmitGrade: (
    submissionId: string,
    updatedRubric: StudentSubmission['rubric'],
    feedback: string,
    flagged: boolean
  ) => void;
  onToggleStudentSupportFlag: (studentId: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  activeTab,
  courses,
  units,
  submissions,
  students,
  selectedCourseId,
  onSelectCourse,
  onToggleLessonComplete,
  onUpdateUnitStatus,
  onAddUnit,
  onSubmitGrade,
  onToggleStudentSupportFlag,
}) => {
  const [term, setTerm] = useState<'Fall Term 2026' | 'Spring Term 2027'>('Fall Term 2026');
  const [expandedUnitId, setExpandedUnitId] = useState<string>('unit-calc-3');
  const [isNewUnitOpen, setIsNewUnitOpen] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitDates, setNewUnitDates] = useState('Dec 01 – Dec 18');
  const [newUnitStandards, setNewUnitStandards] = useState('AP-CALC.OPT.1–3');
  const [newUnitObjectives, setNewUnitObjectives] = useState('');
  const [newUnitFirstLesson, setNewUnitFirstLesson] = useState('');

  // Grading state
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'graded' | 'flagged'>('all');
  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id ?? '');
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [draftFeedback, setDraftFeedback] = useState<Record<string, string>>({});
  const [rosterQuery, setRosterQuery] = useState('');

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId]
  );

  const courseUnits = useMemo(
    () => units.filter((u) => u.courseId === activeCourse.id && u.term === term),
    [units, activeCourse.id, term]
  );

  const filteredSubmissions = useMemo(() => {
    if (queueFilter === 'all') return submissions;
    return submissions.filter((s) => s.status === queueFilter);
  }, [submissions, queueFilter]);

  const activeSubmission = useMemo(
    () =>
      submissions.find((s) => s.id === selectedSubId) ??
      filteredSubmissions[0] ??
      submissions[0],
    [submissions, selectedSubId, filteredSubmissions]
  );

  const courseRoster = useMemo(() => {
    const q = rosterQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || s.advisor.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [students, rosterQuery]);

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;
    onAddUnit({
      courseId: activeCourse.id,
      term,
      unitNumber: courseUnits.length + 1,
      title: newUnitTitle.trim(),
      dateRange: newUnitDates.trim() || 'Dec 01 – Dec 18',
      standardsCode: newUnitStandards.trim() || 'CURRICULUM-STD-1',
      pacingPercent: 0,
      status: 'scheduled',
      objectives:
        newUnitObjectives.trim() ||
        'Guided seminar inquiry and formative benchmark preparation.',
      lessons: [
        {
          id: `lesson-${Date.now()}`,
          title: newUnitFirstLesson.trim() || 'Foundational Seminar & Concept Framing',
          durationMinutes: 55,
          modality: 'Seminar',
          completed: false,
        },
      ],
    });
    setNewUnitTitle('');
    setNewUnitObjectives('');
    setNewUnitFirstLesson('');
    setIsNewUnitOpen(false);
  };

  if (activeTab === 'grading') {
    const currentRubric = activeSubmission
      ? activeSubmission.rubric.map((r) => ({
          ...r,
          score: draftScores[r.id] !== undefined ? draftScores[r.id] : r.score,
        }))
      : [];
    const totalScore = currentRubric.reduce((acc, r) => acc + r.score, 0);
    const totalMax = currentRubric.reduce((acc, r) => acc + r.maxPoints, 0);
    const currentFeedback = activeSubmission
      ? draftFeedback[activeSubmission.id] ?? activeSubmission.teacherFeedback
      : '';

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#45474c]">
              Pedagogical Evaluation · Rubric Grading Queue
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
              Assessment &amp; Rubric Workspace
            </h1>
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] border border-[#dce9ff] rounded-lg self-start"
            role="group"
            aria-label="Filter submissions"
          >
            {[
              { key: 'all', label: `All (${submissions.length})` },
              {
                key: 'pending',
                label: `Pending (${submissions.filter((s) => s.status === 'pending').length})`,
              },
              {
                key: 'graded',
                label: `Graded (${submissions.filter((s) => s.status === 'graded').length})`,
              },
              {
                key: 'flagged',
                label: `Flagged (${submissions.filter((s) => s.status === 'flagged').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setQueueFilter(tab.key as typeof queueFilter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  queueFilter === tab.key
                    ? 'bg-white text-[#0b1c30] shadow-xs'
                    : 'text-[#45474c] hover:text-[#0b1c30]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Queue */}
          <div className="lg:col-span-5 bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0b1c30]">Submission Queue</h2>
              <span className="text-xs font-mono tabular-nums text-[#45474c]">
                {filteredSubmissions.length} items
              </span>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-[#0b1c30]">Queue is clear</p>
                <p className="text-xs text-[#45474c] mt-1">
                  No student submissions match this filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {filteredSubmissions.map((sub) => {
                  const isActive = activeSubmission?.id === sub.id;
                  const subTotal = sub.rubric.reduce((a, r) => a + r.score, 0);
                  const subMax = sub.rubric.reduce((a, r) => a + r.maxPoints, 0);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`w-full text-left px-5 py-4 transition-colors space-y-1.5 ${
                        isActive ? 'bg-[#eff4ff]' : 'hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#0b1c30]">
                          {sub.studentName}
                        </span>
                        <StatusIndicator state={sub.status} />
                      </div>
                      <p className="text-xs font-medium text-[#0b1c30] truncate">
                        {sub.assignmentTitle}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#45474c] font-mono tabular-nums">
                        <span>
                          {sub.courseCode} · {sub.submittedAt}
                        </span>
                        <span className="font-semibold text-[#0b1c30]">
                          {subTotal}/{subMax} pts
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Rubric Grader */}
          {activeSubmission && (
            <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
                <div>
                  <div className="text-xs text-[#45474c]">
                    <span className="font-mono font-semibold text-[#0051d5]">
                      {activeSubmission.courseCode}
                    </span>{' '}
                    · {activeSubmission.studentName} · {activeSubmission.submittedAt}
                  </div>
                  <h2 className="text-lg font-bold text-[#0b1c30] mt-1">
                    {activeSubmission.assignmentTitle}
                  </h2>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs text-[#45474c]">Calculated Score</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                    {totalScore}{' '}
                    <span className="text-sm font-normal text-[#45474c]">
                      / {totalMax} pts
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#0b1c30]">
                  Student Submission Excerpt
                </p>
                <p className="text-sm text-[#45474c] leading-relaxed bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl p-4">
                  {activeSubmission.excerpt}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#0b1c30]">
                  Rubric Criteria Matrix
                </p>
                <div className="divide-y divide-[#f1f5f9]">
                  {currentRubric.map((criterion) => (
                    <div key={criterion.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <label
                            htmlFor={`slider-${criterion.id}`}
                            className="text-sm font-semibold text-[#0b1c30]"
                          >
                            {criterion.label}
                          </label>
                          <p className="text-xs text-[#45474c] mt-0.5">
                            {criterion.descriptor}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            id={`slider-${criterion.id}`}
                            type="range"
                            min={0}
                            max={criterion.maxPoints}
                            value={criterion.score}
                            onChange={(e) =>
                              setDraftScores((prev) => ({
                                ...prev,
                                [criterion.id]: Number(e.target.value),
                              }))
                            }
                            className="w-24 accent-[#0051d5]"
                          />
                          <span className="text-sm font-mono font-semibold tabular-nums text-[#0b1c30] w-14 text-right">
                            {criterion.score}/{criterion.maxPoints}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
                <label
                  htmlFor="teacher-feedback-input"
                  className="block text-xs font-semibold text-[#0b1c30]"
                >
                  Direct Pedagogical Feedback (Visible to Student &amp; Parents)
                </label>
                <textarea
                  id="teacher-feedback-input"
                  rows={3}
                  value={currentFeedback}
                  onChange={(e) =>
                    setDraftFeedback((prev) => ({
                      ...prev,
                      [activeSubmission.id]: e.target.value,
                    }))
                  }
                  placeholder="Write concise guidance on conceptual mastery and next steps..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/15"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onSubmitGrade(activeSubmission.id, currentRubric, currentFeedback, true)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#d97706] bg-white border border-[#fde68a] hover:bg-[#fffbeb] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  Flag for Workshop Review
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSubmitGrade(activeSubmission.id, currentRubric, currentFeedback, false)
                  }
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0051d5] hover:bg-[#003ea8] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Publish Grade ({totalScore}/{totalMax})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'roster') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#45474c]">
              Student Mastery &amp; Support Telemetry
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
              Class Roster &amp; Interventions
            </h1>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              className="w-4 h-4 text-[#75777d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={rosterQuery}
              onChange={(e) => setRosterQuery(e.target.value)}
              placeholder="Filter student or advisor..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/15"
            />
          </div>
        </div>

        <section className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#45474c]">
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-4">Advisor</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">Mastery</th>
                  <th className="py-3 px-4 text-right">GPA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-sm">
                {courseRoster.map((stu) => (
                  <tr key={stu.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-[#0b1c30]">{stu.name}</p>
                      <p className="text-xs text-[#45474c]">{stu.gradeLevel}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#45474c]">{stu.advisor}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0b1c30]">
                      {stu.attendanceRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#0b1c30]">
                      {stu.masteryScore}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0b1c30]">
                      {stu.gpa}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusIndicator
                        state={stu.flaggedForSupport ? 'remediation' : 'on_track'}
                        customLabel={stu.flaggedForSupport ? 'Support Active' : 'On Track'}
                      />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleStudentSupportFlag(stu.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#334155] bg-white border border-[#cbd5e1] hover:bg-[#f8f9ff] rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {stu.flaggedForSupport ? 'Clear Flag' : 'Flag Support'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Course Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#45474c]">
            Curriculum Orchestration Matrix · {activeCourse.teacherName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
            {activeCourse.code}: {activeCourse.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select course"
            value={activeCourse.id}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-[#cbd5e1] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#0051d5]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.title}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] border border-[#dce9ff] rounded-lg">
            {(['Fall Term 2026', 'Spring Term 2027'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  term === t
                    ? 'bg-white text-[#0b1c30] shadow-xs'
                    : 'text-[#45474c] hover:text-[#0b1c30]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsNewUnitOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0051d5] hover:bg-[#003ea8] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Syllabus Unit
          </button>
        </div>
      </div>

      {/* Course Overview Strip */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={activeCourse.pacingPercent}
            size={52}
            strokeWidth={5}
            tone={activeCourse.pacingPercent < 80 ? 'remediation' : 'active'}
            label="Course pacing"
          />
          <div>
            <p className="text-xs text-[#45474c]">Course Pacing Velocity</p>
            <p className="text-sm font-semibold text-[#0b1c30]">
              {activeCourse.scheduleSlot} · {activeCourse.room}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-[#45474c]">Enrolled</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#0b1c30]">
              {activeCourse.enrolledCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#45474c]">Mean Mastery</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#059669]">
              {activeCourse.averageMastery}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[#45474c]">Units Mapped</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#0b1c30]">
              {courseUnits.length}
            </p>
          </div>
        </div>
      </div>

      {/* Syllabus Tree */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0b1c30]">
              Syllabus Units &amp; Pedagogical Milestones
            </h2>
            <p className="text-xs text-[#45474c] mt-0.5">
              Expand any unit to check off lessons or adjust pacing status.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#45474c]">{term}</span>
        </div>

        {courseUnits.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-[#0b1c30]">
              No units drafted for {term} yet
            </p>
            <p className="text-xs text-[#45474c]">
              Begin sequencing objectives and lab modules for {activeCourse.title}.
            </p>
            <button
              type="button"
              onClick={() => setIsNewUnitOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0051d5] rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Create First Unit
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {courseUnits.map((unit) => {
              const isExpanded = expandedUnitId === unit.id;
              const ringTone =
                unit.status === 'completed'
                  ? 'mastery'
                  : unit.status === 'remediation'
                  ? 'remediation'
                  : unit.status === 'active'
                  ? 'active'
                  : 'slate';
              return (
                <div key={unit.id} className="transition-colors">
                  <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#f8f9ff]">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedUnitId(isExpanded ? '' : unit.id)
                      }
                      className="flex items-center gap-4 text-left min-w-0 flex-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#45474c] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#45474c] shrink-0" />
                      )}
                      <ProgressRing
                        value={unit.pacingPercent}
                        size={44}
                        strokeWidth={4}
                        tone={ringTone}
                        label={`Unit ${unit.unitNumber} pacing`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs text-[#45474c] font-mono tabular-nums">
                          Unit 0{unit.unitNumber} · {unit.dateRange} · {unit.standardsCode}
                        </div>
                        <h3 className="text-sm font-semibold text-[#0b1c30] mt-0.5 truncate">
                          {unit.title}
                        </h3>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 pl-8 md:pl-0 shrink-0">
                      <StatusIndicator state={unit.status} />
                      <select
                        aria-label={`Change status for ${unit.title}`}
                        value={unit.status}
                        onChange={(e) =>
                          onUpdateUnitStatus(unit.id, e.target.value as UnitStatus)
                        }
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-[#cbd5e1] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#0051d5]"
                      >
                        <option value="completed">Completed</option>
                        <option value="active">Active Pacing</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="remediation">Remediation Flag</option>
                      </select>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-5 pt-2 pl-16 space-y-4 bg-[#f8f9ff]/60 border-t border-[#f1f5f9]">
                      <p className="text-xs text-[#45474c] leading-relaxed max-w-3xl">
                        <span className="font-semibold text-[#0b1c30]">Objectives: </span>
                        {unit.objectives}
                      </p>

                      <div className="divide-y divide-[#e2e8f0] bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                        {unit.lessons.map((lesson) => (
                          <label
                            key={lesson.id}
                            className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-[#f8f9ff] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={lesson.completed}
                                onChange={() =>
                                  onToggleLessonComplete(unit.id, lesson.id)
                                }
                                className="w-4 h-4 rounded border-[#cbd5e1] text-[#0051d5] focus:ring-[#0051d5]"
                              />
                              <span
                                className={`text-sm font-medium truncate ${
                                  lesson.completed
                                    ? 'line-through text-[#75777d]'
                                    : 'text-[#0b1c30]'
                                }`}
                              >
                                {lesson.title}
                              </span>
                            </div>
                            <span className="text-xs text-[#45474c] font-mono tabular-nums whitespace-nowrap shrink-0">
                              {lesson.modality} · {lesson.durationMinutes} min
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* New Unit Modal */}
      {isNewUnitOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#091426]/35 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-unit-title"
        >
          <form
            onSubmit={handleCreateUnit}
            className="w-full max-w-lg bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#f1f5f9]">
              <div>
                <p className="text-xs font-medium text-[#0051d5]">
                  {activeCourse.code} · {term}
                </p>
                <h2 id="new-unit-title" className="text-lg font-bold text-[#0b1c30] mt-0.5">
                  Add Curriculum Unit
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUnitOpen(false)}
                className="p-1.5 text-[#45474c] hover:text-[#0b1c30] rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Unit Title
                </label>
                <input
                  required
                  type="text"
                  value={newUnitTitle}
                  onChange={(e) => setNewUnitTitle(e.target.value)}
                  placeholder="e.g., Differential Equations & Logistic Growth"
                  className="w-full px-3 py-2 text-sm border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Date Window
                  </label>
                  <input
                    type="text"
                    value={newUnitDates}
                    onChange={(e) => setNewUnitDates(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Standards Code
                  </label>
                  <input
                    type="text"
                    value={newUnitStandards}
                    onChange={(e) => setNewUnitStandards(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Learning Objectives
                </label>
                <textarea
                  rows={2}
                  value={newUnitObjectives}
                  onChange={(e) => setNewUnitObjectives(e.target.value)}
                  placeholder="Summarize core competencies and mastery criteria..."
                  className="w-full px-3 py-2 text-sm border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Opening Lesson Module
                </label>
                <input
                  type="text"
                  value={newUnitFirstLesson}
                  onChange={(e) => setNewUnitFirstLesson(e.target.value)}
                  placeholder="e.g., Slope Fields & Euler Approximation Seminar"
                  className="w-full px-3 py-2 text-sm border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setIsNewUnitOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#45474c] hover:text-[#0b1c30]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0051d5] hover:bg-[#003ea8] rounded-lg transition-colors"
              >
                Save &amp; Schedule Unit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
