import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CohortMetric,
  CourseRecord,
  CurriculumApproval,
  DepartmentSummary,
  PrincipalTab,
} from '../../types/academic';
import { ProgressRing } from '../ui/ProgressRing';
import { StatusIndicator } from '../ui/StatusIndicator';

interface PrincipalViewProps {
  activeTab: PrincipalTab;
  departments: DepartmentSummary[];
  approvals: CurriculumApproval[];
  cohorts: CohortMetric[];
  courses: CourseRecord[];
  onApproveCurriculum: (id: string, note: string) => void;
  onRequestRevision: (id: string, note: string) => void;
}

export const PrincipalView: React.FC<PrincipalViewProps> = ({
  activeTab,
  departments,
  approvals,
  cohorts,
  courses,
  onApproveCurriculum,
  onRequestRevision,
}) => {
  const [deptFilter, setDeptFilter] = useState<'all' | 'ahead' | 'on_track' | 'attention'>('all');
  const [selectedDept, setSelectedDept] = useState<DepartmentSummary | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [facultyQuery, setFacultyQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<CohortMetric>(cohorts[0]);

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === 'pending'),
    [approvals]
  );

  const avgPacing = useMemo(() => {
    const sum = departments.reduce((acc, d) => acc + d.pacingRate, 0);
    return Math.round(sum / departments.length);
  }, [departments]);

  const avgMastery = useMemo(() => {
    const sum = departments.reduce((acc, d) => acc + d.masteryRate, 0);
    return Math.round(sum / departments.length);
  }, [departments]);

  const avgAttendance = useMemo(() => {
    const sum = cohorts.reduce((acc, c) => acc + c.attendanceRate, 0);
    return (sum / cohorts.length).toFixed(1);
  }, [cohorts]);

  const filteredDepartments = useMemo(() => {
    if (deptFilter === 'all') return departments;
    return departments.filter((d) => d.status === deptFilter);
  }, [departments, deptFilter]);

  const filteredCourses = useMemo(() => {
    const q = facultyQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.teacherName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    );
  }, [courses, facultyQuery]);

  if (activeTab === 'faculty') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#45474c]">
              Institutional Governance · Fall Term 2026
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
              Faculty Pacing &amp; Audit Directory
            </h1>
          </div>
          <div className="relative w-full sm:w-80">
            <Search
              className="w-4 h-4 text-[#75777d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={facultyQuery}
              onChange={(e) => setFacultyQuery(e.target.value)}
              placeholder="Search faculty, course, or code..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/15"
            />
          </div>
        </div>

        <section className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#0b1c30]">
              Active Course Sections ({filteredCourses.length})
            </h2>
            <span className="text-xs text-[#45474c] tabular-nums">
              Term Week 11 of 16
            </span>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-[#0b1c30]">No matching courses found</p>
              <p className="text-xs text-[#45474c] mt-1">
                Adjust your search query to inspect other faculty sections.
              </p>
              <button
                type="button"
                onClick={() => setFacultyQuery('')}
                className="mt-4 px-4 py-2 text-xs font-semibold text-[#0051d5] border border-[#cbd5e1] rounded-lg hover:bg-[#f8f9ff] transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#45474c] tracking-wide">
                    <th className="py-3 px-6">Course &amp; Section</th>
                    <th className="py-3 px-4">Lead Instructor</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Enrolled</th>
                    <th className="py-3 px-4 text-right">Syllabus Pacing</th>
                    <th className="py-3 px-4 text-right">Mean Mastery</th>
                    <th className="py-3 px-6 text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-sm">
                  {filteredCourses.map((course) => {
                    const state =
                      course.pacingPercent >= 85
                        ? 'on_track'
                        : course.pacingPercent >= 78
                        ? 'active'
                        : 'attention';
                    return (
                      <tr
                        key={course.id}
                        className="hover:bg-[#f8f9ff] transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-[#0b1c30]">{course.title}</div>
                          <div className="text-xs text-[#45474c] font-mono tabular-nums mt-0.5">
                            {course.code} · {course.room}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#0b1c30] font-medium">
                          {course.teacherName}
                        </td>
                        <td className="py-3.5 px-4 text-[#45474c] text-xs">
                          {course.department}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0b1c30]">
                          {course.enrolledCount}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#0b1c30]">
                          {course.pacingPercent}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0b1c30]">
                          {course.averageMastery}%
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <StatusIndicator state={state} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Curriculum Governance Log
              </h2>
              <p className="text-xs text-[#45474c] mt-0.5">
                Historical and pending syllabus variance reviews submitted by department chairs.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#45474c]">
              {approvals.length} total filings
            </span>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {approvals.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#45474c]">
                    <span className="font-mono font-semibold text-[#0b1c30]">
                      {item.courseCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.teacherName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Submitted {item.submittedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-[#0b1c30]">{item.pacingImpact}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0b1c30]">{item.unitTitle}</p>
                  <p className="text-xs text-[#45474c] max-w-2xl">{item.summary}</p>
                  {item.reviewerNote && (
                    <p className="text-xs text-[#0051d5] font-medium pt-0.5">
                      Principal note: {item.reviewerNote}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <StatusIndicator state={item.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (activeTab === 'cohorts') {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs font-medium text-[#45474c]">
            Grade-Level Academic Health · 807 Enrolled Students
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
            Cohort Mastery &amp; Attendance Analytics
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-base font-semibold text-[#0b1c30]">
                  Cohort Comparison Matrix
                </h2>
                <p className="text-xs text-[#45474c] mt-0.5">
                  Select a grade cohort to inspect advisor notes and remediation headcount.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#45474c]">
                Target: 85% Mastery
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {cohorts.map((cohort) => {
                const isSelected = selectedCohort.id === cohort.id;
                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() => setSelectedCohort(cohort)}
                    className={`w-full text-left py-4 px-3 -mx-3 rounded-xl transition-colors flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-[#eff4ff]' : 'hover:bg-[#f8f9ff]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0b1c30]">
                          {cohort.gradeLabel}
                        </span>
                        <span className="text-xs text-[#45474c] font-mono tabular-nums">
                          · {cohort.enrolledCount} students
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${cohort.masteryRate}%`,
                              backgroundColor:
                                cohort.masteryRate >= 88 ? '#059669' : '#0051d5',
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold tabular-nums text-[#0b1c30] w-10 text-right">
                          {cohort.masteryRate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono tabular-nums font-semibold text-[#0b1c30]">
                        {cohort.attendanceRate}% attend.
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-[#d97706] mt-0.5">
                        {cohort.remediationCount} flagged
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
              <div>
                <p className="text-xs font-medium text-[#0051d5]">Cohort Spotlight</p>
                <h2 className="text-xl font-bold text-[#0b1c30] mt-0.5">
                  {selectedCohort.gradeLabel}
                </h2>
                <p className="text-xs text-[#45474c] mt-1">
                  Lead Advisor: {selectedCohort.leadAdvisor}
                </p>
              </div>
              <ProgressRing
                value={selectedCohort.masteryRate}
                size={56}
                strokeWidth={5}
                tone={selectedCohort.masteryRate >= 88 ? 'mastery' : 'active'}
                label="Cohort Mastery"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 py-1">
              <div>
                <p className="text-xs text-[#45474c]">On-Track</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#059669] mt-0.5">
                  {selectedCohort.onTrackCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#45474c]">Intervention</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#d97706] mt-0.5">
                  {selectedCohort.remediationCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#45474c]">Attendance</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#0b1c30] mt-0.5">
                  {selectedCohort.attendanceRate}%
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f1f5f9] space-y-2">
              <p className="text-xs font-semibold text-[#0b1c30]">
                Current Instructional Focus
              </p>
              <p className="text-sm text-[#45474c] leading-relaxed">
                {selectedCohort.focusArea}. Advisors are conducting mid-term check-ins with all{' '}
                <span className="font-semibold text-[#0b1c30] tabular-nums">
                  {selectedCohort.remediationCount}
                </span>{' '}
                students flagged for targeted seminar support prior to December benchmarks.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#45474c]">
            Westbridge Preparatory · Fall Term 2026
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30] mt-1">
            Institutional Academic Overview
          </h1>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] border border-[#dce9ff] rounded-lg self-start"
          role="group"
          aria-label="Filter departments by pacing status"
        >
          {[
            { key: 'all', label: 'All Departments' },
            { key: 'ahead', label: 'Ahead' },
            { key: 'on_track', label: 'On Track' },
            { key: 'attention', label: 'Needs Review' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDeptFilter(opt.key as typeof deptFilter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                deptFilter === opt.key
                  ? 'bg-white text-[#0b1c30] shadow-xs'
                  : 'text-[#45474c] hover:text-[#0b1c30]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <section
        aria-label="Campus Key Metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Campus Attendance</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {avgAttendance}%
            </span>
            <span className="text-xs font-semibold font-mono tabular-nums text-[#059669]">
              +0.9% YoY
            </span>
          </div>
          <p className="text-xs text-[#45474c] mt-2">Across 807 enrolled students</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Curriculum Pacing</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {avgPacing}%
            </span>
            <span className="text-xs font-semibold text-[#0051d5]">Week 11 target: 85%</span>
          </div>
          <p className="text-xs text-[#45474c] mt-2">74 active course sections</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Cohort Mastery Rate</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {avgMastery}%
            </span>
            <span className="text-xs font-semibold text-[#059669]">+2.3% vs Mid-Term</span>
          </div>
          <p className="text-xs text-[#45474c] mt-2">Standardized rubric average</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#45474c]">Pending Syllabus Audits</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {pendingApprovals.length}
            </span>
            <StatusIndicator
              state={pendingApprovals.length > 0 ? 'pending' : 'approved'}
              customLabel={pendingApprovals.length > 0 ? 'Action Needed' : 'All Cleared'}
            />
          </div>
          <p className="text-xs text-[#45474c] mt-2">Department variance filings</p>
        </div>
      </section>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Department Pacing Matrix */}
        <section className="xl:col-span-7 bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Departmental Pacing &amp; Mastery
              </h2>
              <p className="text-xs text-[#45474c] mt-0.5">
                Click any department row to inspect chair notes and schedule variance.
              </p>
            </div>
            <SlidersHorizontal className="w-4 h-4 text-[#75777d]" aria-hidden="true" />
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {filteredDepartments.map((dept) => {
              const ringTone =
                dept.status === 'ahead'
                  ? 'mastery'
                  : dept.status === 'attention'
                  ? 'remediation'
                  : 'active';
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className="w-full text-left px-6 py-4 hover:bg-[#f8f9ff] transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <ProgressRing
                      value={dept.pacingRate}
                      size={48}
                      strokeWidth={4}
                      tone={ringTone}
                      label={`${dept.name} pacing`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0b1c30] truncate">
                        {dept.name}
                      </p>
                      <p className="text-xs text-[#45474c] mt-0.5">
                        Chair: {dept.chair} ·{' '}
                        <span className="font-mono tabular-nums">
                          {dept.facultyCount} faculty · {dept.coursesCount} courses
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-mono font-semibold tabular-nums text-[#0b1c30]">
                        {dept.masteryRate}% mastery
                      </p>
                      <p className="text-[11px] font-mono tabular-nums text-[#45474c]">
                        {dept.attendanceDelta} attend.
                      </p>
                    </div>
                    <StatusIndicator state={dept.status} />
                    <ChevronRight className="w-4 h-4 text-[#75777d]" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Curriculum Approval Queue */}
        <section className="xl:col-span-5 bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-base font-semibold text-[#0b1c30]">
                Curriculum Approval Queue
              </h2>
              <p className="text-xs text-[#45474c] mt-0.5">
                Review faculty unit pacing adjustments before term lock.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-[#0051d5]">
              {pendingApprovals.length} pending
            </span>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {approvals.map((item) => {
              const isReviewing = reviewingId === item.id;
              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[#45474c]">
                        <span className="font-mono font-semibold text-[#0b1c30]">
                          {item.courseCode}
                        </span>{' '}
                        · {item.teacherName} · {item.submittedDate}
                      </div>
                      <h3 className="text-sm font-semibold text-[#0b1c30] mt-1">
                        {item.unitTitle}
                      </h3>
                    </div>
                    <StatusIndicator state={item.status} />
                  </div>

                  <p className="text-xs text-[#45474c] leading-relaxed">{item.summary}</p>

                  <div className="text-xs font-medium text-[#0b1c30]">
                    Pacing impact:{' '}
                    <span className="font-mono text-[#0051d5]">{item.pacingImpact}</span>
                  </div>

                  {item.reviewerNote && (
                    <p className="text-xs text-[#45474c] bg-[#f8f9ff] px-3 py-2 rounded-lg border border-[#e2e8f0]">
                      Decision note: {item.reviewerNote}
                    </p>
                  )}

                  {item.status === 'pending' && !isReviewing && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onApproveCurriculum(
                            item.id,
                            'Approved for Fall Term 2026 instructional sequence.'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#091426] hover:bg-[#1e293b] rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Approve Unit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingId(item.id);
                          setReviewNote('');
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-[#334155] bg-white border border-[#cbd5e1] hover:bg-[#f8f9ff] rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Request Revision
                      </button>
                    </div>
                  )}

                  {isReviewing && (
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-medium text-[#0b1c30]">
                        Revision rationale for {item.teacherName}
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Specify benchmark alignment or pacing adjustment needed..."
                        className="w-full px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/15"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onRequestRevision(
                              item.id,
                              reviewNote.trim() ||
                                'Please align assessment checkpoint date with departmental calendar.'
                            );
                            setReviewingId(null);
                            setReviewNote('');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#d97706] hover:bg-[#b45309] rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Send Revision Note
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-[#45474c] hover:text-[#0b1c30] rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Slide-over Department Detail Drawer */}
      {selectedDept && (
        <div
          className="fixed inset-0 z-50 bg-[#091426]/30 backdrop-blur-[1px] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dept-drawer-title"
        >
          <div className="w-full max-w-md bg-white h-full border-l border-[#e2e8f0] p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
                <div>
                  <p className="text-xs font-medium text-[#0051d5]">Department Audit</p>
                  <h2
                    id="dept-drawer-title"
                    className="text-xl font-bold text-[#0b1c30] mt-1"
                  >
                    {selectedDept.name}
                  </h2>
                  <p className="text-xs text-[#45474c] mt-1">
                    Department Chair: {selectedDept.chair}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDept(null)}
                  className="p-2 text-[#45474c] hover:text-[#0b1c30] hover:bg-[#f8f9ff] rounded-lg"
                  aria-label="Close department audit drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <ProgressRing
                  value={selectedDept.pacingRate}
                  size={64}
                  strokeWidth={5}
                  tone={selectedDept.status === 'attention' ? 'remediation' : 'mastery'}
                />
                <div className="space-y-1">
                  <StatusIndicator state={selectedDept.status} />
                  <p className="text-xs text-[#45474c]">
                    Mean Mastery:{' '}
                    <span className="font-mono font-semibold text-[#0b1c30]">
                      {selectedDept.masteryRate}%
                    </span>{' '}
                    · Attendance Delta:{' '}
                    <span className="font-mono font-semibold text-[#0b1c30]">
                      {selectedDept.attendanceDelta}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
                <p className="text-xs font-semibold text-[#0b1c30]">Chair Briefing</p>
                <p className="text-sm text-[#45474c] leading-relaxed">
                  {selectedDept.notes}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#f1f5f9]">
                <p className="text-xs font-semibold text-[#0b1c30]">
                  Tracked Courses in Department
                </p>
                <div className="divide-y divide-[#f1f5f9]">
                  {courses
                    .filter((c) => c.department === selectedDept.name)
                    .map((c) => (
                      <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#0b1c30]">{c.title}</p>
                          <p className="text-xs text-[#45474c]">
                            {c.code} · {c.teacherName}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold tabular-nums text-[#0b1c30]">
                          {c.pacingPercent}% paced
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setSelectedDept(null)}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#091426] hover:bg-[#1e293b] rounded-lg transition-colors"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
