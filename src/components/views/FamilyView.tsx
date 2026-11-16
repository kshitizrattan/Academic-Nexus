import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Mail, Send } from 'lucide-react';
import {
  CourseRecord,
  FacultyMessage,
  FamilyTab,
  RosterStudent,
  ScheduleBlock,
} from '../../types/academic';
import { ProgressRing } from '../ui/ProgressRing';
import { StatusIndicator } from '../ui/StatusIndicator';

interface FamilyViewProps {
  activeTab: FamilyTab;
  students: RosterStudent[];
  courses: CourseRecord[];
  schedule: ScheduleBlock[];
  messages: FacultyMessage[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onToggleCheckpointPrepared: (studentId: string, checkpointId: string) => void;
  onSendMessage: (
    studentId: string,
    courseCode: string,
    subject: string,
    body: string
  ) => void;
  onMarkMessageRead: (messageId: string) => void;
}

export const FamilyView: React.FC<FamilyViewProps> = ({
  activeTab,
  students,
  courses,
  schedule,
  messages,
  selectedStudentId,
  onSelectStudent,
  onToggleCheckpointPrepared,
  onSendMessage,
  onMarkMessageRead,
}) => {
  const familyStudents = useMemo(
    () => students.filter((s) => s.id === 'stu-maya' || s.id === 'stu-leo'),
    [students]
  );

  const activeStudent = useMemo(
    () =>
      familyStudents.find((s) => s.id === selectedStudentId) ?? familyStudents[0],
    [familyStudents, selectedStudentId]
  );

  const studentCourses = useMemo(
    () => courses.filter((c) => activeStudent.courseIds.includes(c.id)),
    [courses, activeStudent.courseIds]
  );

  const studentMessages = useMemo(
    () => messages.filter((m) => m.studentId === activeStudent.id),
    [messages, activeStudent.id]
  );

  const studentSchedule = useMemo(() => {
    const enrolledCodes = new Set(studentCourses.map((c) => c.code));
    return schedule.filter((s) => enrolledCodes.has(s.courseCode));
  }, [schedule, studentCourses]);

  const [msgCourse, setMsgCourse] = useState(studentCourses[0]?.code ?? 'MATH-401');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) return;
    onSendMessage(activeStudent.id, msgCourse, msgSubject.trim(), msgBody.trim());
    setMsgSubject('');
    setMsgBody('');
  };

  const StudentSwitcher = (
    <div
      className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] border border-[#dce9ff] rounded-lg self-start"
      role="group"
      aria-label="Select student profile"
    >
      {familyStudents.map((stu) => (
        <button
          key={stu.id}
          type="button"
          onClick={() => onSelectStudent(stu.id)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeStudent.id === stu.id
              ? 'bg-white text-[#0b1c30] shadow-xs'
              : 'text-[#45474c] hover:text-[#0b1c30]'
          }`}
        >
          {stu.name} · {stu.gradeLevel}
        </button>
      ))}
    </div>
  );

  if (activeTab === 'schedule') {
    const days: ScheduleBlock['day'][] = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ];
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#45474c]">
              Weekly Instructional Timetable · Advisor: {activeStudent.advisor}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
              {activeStudent.name}’s Class Schedule
            </h1>
          </div>
          {StudentSwitcher}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl divide-y divide-[#f1f5f9]">
          {days.map((day) => {
            const blocks = studentSchedule.filter((b) => b.day === day);
            return (
              <div key={day} className="p-6 flex flex-col md:flex-row gap-4 md:gap-8">
                <div className="md:w-36 shrink-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0b1c30]">
                    <Calendar className="w-4 h-4 text-[#0051d5]" aria-hidden="true" />
                    <span>{day}</span>
                  </div>
                  <p className="text-xs text-[#45474c] mt-0.5 font-mono tabular-nums">
                    {blocks.length} sessions
                  </p>
                </div>

                {blocks.length === 0 ? (
                  <p className="text-sm text-[#45474c] italic">
                    Independent Seminar &amp; Directed Study Period
                  </p>
                ) : (
                  <div className="flex-1 divide-y divide-[#f1f5f9]">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-mono text-[#0051d5] font-semibold">
                            {block.time} · {block.courseCode} · {block.room}
                          </div>
                          <p className="text-sm font-semibold text-[#0b1c30] mt-0.5">
                            {block.courseTitle}
                          </p>
                          <p className="text-xs text-[#45474c] mt-0.5">
                            Topic: {block.focusTopic}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#45474c] shrink-0">
                          {block.teacherName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'messages') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#45474c]">
              Home–School Transparency &amp; Faculty Notes
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
              Faculty Correspondence
            </h1>
          </div>
          {StudentSwitcher}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Thread */}
          <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Messages for {activeStudent.name} ({studentMessages.length})
              </h2>
              <Mail className="w-4 h-4 text-[#75777d]" aria-hidden="true" />
            </div>

            {studentMessages.length === 0 ? (
              <p className="text-sm text-[#45474c] py-6 text-center">
                No faculty messages logged for {activeStudent.name} this term.
              </p>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {studentMessages.map((msg) => (
                  <div key={msg.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-[#45474c]">
                          <span className="font-semibold text-[#0b1c30]">
                            {msg.senderName}
                          </span>{' '}
                          · {msg.senderRole} ·{' '}
                          <span className="font-mono text-[#0051d5]">
                            {msg.courseCode}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#0b1c30] mt-1">
                          {msg.subject}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#75777d] shrink-0">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-[#45474c] leading-relaxed">{msg.body}</p>
                    {msg.unread && (
                      <button
                        type="button"
                        onClick={() => onMarkMessageRead(msg.id)}
                        className="text-xs font-semibold text-[#0051d5] hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Compose */}
          <form
            onSubmit={handleMessageSubmit}
            className="lg:col-span-5 bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4"
          >
            <div className="pb-3 border-b border-[#f1f5f9]">
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Message Subject Instructor
              </h2>
              <p className="text-xs text-[#45474c] mt-0.5">
                Request office hours, conference slots, or assignment clarification.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                Course &amp; Instructor
              </label>
              <select
                value={msgCourse}
                onChange={(e) => setMsgCourse(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
              >
                {studentCourses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} · {c.title} ({c.teacherName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                Subject
              </label>
              <input
                required
                type="text"
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                placeholder="e.g., Request for mid-term lab review"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                Note
              </label>
              <textarea
                required
                rows={4}
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Write a note to the course instructor..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5]"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0051d5] hover:bg-[#003ea8] rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              Send Message
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#45474c]">
            Family Progress Portal · Advisor: {activeStudent.advisor}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
            {activeStudent.name} · Academic Standing
          </h1>
        </div>
        {StudentSwitcher}
      </div>

      {/* 4-Column Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Cumulative Term GPA</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30] mt-2">
            {activeStudent.gpa}
          </p>
          <p className="text-xs text-[#45474c] mt-2">4.0 unweighted scale</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Term Mastery Index</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#059669]">
              {activeStudent.masteryScore}%
            </span>
            <StatusIndicator
              state={activeStudent.flaggedForSupport ? 'remediation' : 'on_track'}
              customLabel={activeStudent.flaggedForSupport ? 'Workshop Active' : 'On Track'}
            />
          </div>
          <p className="text-xs text-[#45474c] mt-2 truncate">{activeStudent.supportNote}</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Attendance Record</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30] mt-2">
            {activeStudent.attendanceRate}%
          </p>
          <p className="text-xs text-[#45474c] mt-2">Fall Term 2026 verified</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Upcoming Checkpoints</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30] mt-2">
            {activeStudent.upcomingCheckpoints.length}
          </p>
          <p className="text-xs text-[#45474c] mt-2">
            {activeStudent.upcomingCheckpoints.filter((u) => u.prepared).length} marked ready
          </p>
        </div>
      </section>

      {/* Main Split: Courses & Assessments vs Upcoming Checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Enrolled Courses */}
          <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Enrolled Course Progress
              </h2>
              <span className="text-xs font-mono tabular-nums text-[#45474c]">
                {studentCourses.length} courses
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {studentCourses.map((course) => (
                <div
                  key={course.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <ProgressRing
                      value={course.averageMastery}
                      size={48}
                      strokeWidth={4}
                      tone={course.averageMastery >= 88 ? 'mastery' : 'active'}
                      label={`${course.title} mastery`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-[#0051d5] font-semibold">
                        {course.code} · {course.teacherName}
                      </p>
                      <h3 className="text-sm font-semibold text-[#0b1c30] truncate">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#45474c] mt-0.5">
                        Syllabus {course.pacingPercent}% completed · {course.room}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator
                    state={course.pacingPercent >= 80 ? 'on_track' : 'attention'}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Recent Graded Assessments */}
          <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Recent Evaluations &amp; Teacher Feedback
              </h2>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {activeStudent.recentAssessments.map((ass) => (
                <div key={ass.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono text-[#45474c]">
                        {ass.courseCode} · {ass.date}
                      </p>
                      <h3 className="text-sm font-semibold text-[#0b1c30] mt-0.5">
                        {ass.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                        {ass.score}/{ass.maxScore}
                      </p>
                      <StatusIndicator state={ass.status} />
                    </div>
                  </div>
                  <p className="text-xs text-[#45474c] leading-relaxed">
                    Teacher note: {ass.feedback}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Upcoming Assessment Checkpoints */}
        <section className="lg:col-span-5 bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4">
          <div className="pb-3 border-b border-[#f1f5f9]">
            <h2 className="text-base font-semibold text-[#0b1c30]">
              Upcoming Assessment Checkpoints
            </h2>
            <p className="text-xs text-[#45474c] mt-0.5">
              Track study readiness ahead of graded exams and seminar papers.
            </p>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {activeStudent.upcomingCheckpoints.map((cp) => (
              <div key={cp.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-[#0051d5] font-semibold">
                      {cp.courseCode} · {cp.type} · {cp.weight}
                    </p>
                    <h3 className="text-sm font-semibold text-[#0b1c30] mt-0.5">
                      {cp.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#d97706] shrink-0">
                    Due {cp.dueDate}
                  </span>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0b1c30] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cp.prepared}
                    onChange={() => onToggleCheckpointPrepared(activeStudent.id, cp.id)}
                    className="w-4 h-4 rounded border-[#cbd5e1] text-[#059669] focus:ring-[#059669]"
                  />
                  <span className={cp.prepared ? 'text-[#059669] font-semibold' : ''}>
                    {cp.prepared ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Study packet &amp; review complete
                      </span>
                    ) : (
                      'Mark study review complete'
                    )}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
