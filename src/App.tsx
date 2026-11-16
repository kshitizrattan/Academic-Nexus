/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { FamilyView } from './components/views/FamilyView';
import { PrincipalView } from './components/views/PrincipalView';
import { TeacherView } from './components/views/TeacherView';
import {
  INITIAL_APPROVALS,
  INITIAL_COHORTS,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_MESSAGES,
  INITIAL_SCHEDULE,
  INITIAL_STUDENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_UNITS,
} from './data/mockData';
import {
  CohortMetric,
  CourseRecord,
  CurriculumApproval,
  CurriculumUnit,
  DepartmentSummary,
  FacultyMessage,
  FamilyTab,
  PersonaRole,
  PrincipalTab,
  RosterStudent,
  StudentSubmission,
  TeacherTab,
  UnitStatus,
} from './types/academic';

export default function App() {
  const [persona, setPersona] = useState<PersonaRole>('principal');
  const [principalTab, setPrincipalTab] = useState<PrincipalTab>('overview');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('pacing');
  const [familyTab, setFamilyTab] = useState<FamilyTab>('progress');

  const [departments, setDepartments] = useState<DepartmentSummary[]>(INITIAL_DEPARTMENTS);
  const [approvals, setApprovals] = useState<CurriculumApproval[]>(INITIAL_APPROVALS);
  const [cohorts] = useState<CohortMetric[]>(INITIAL_COHORTS);
  const [courses, setCourses] = useState<CourseRecord[]>(INITIAL_COURSES);
  const [units, setUnits] = useState<CurriculumUnit[]>(INITIAL_UNITS);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(INITIAL_SUBMISSIONS);
  const [students, setStudents] = useState<RosterStudent[]>(INITIAL_STUDENTS);
  const [messages, setMessages] = useState<FacultyMessage[]>(INITIAL_MESSAGES);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(INITIAL_COURSES[0].id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-maya');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const notify = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Principal handlers
  const handleApproveCurriculum = (id: string, note: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'approved', reviewerNote: note } : a
      )
    );
    notify('Curriculum unit approved and synced to department pacing schedule.');
  };

  const handleRequestRevision = (id: string, note: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'revision_requested', reviewerNote: note } : a
      )
    );
    notify('Revision request sent to course instructor.');
  };

  // Teacher handlers
  const recalculateCoursePacing = (nextUnits: CurriculumUnit[], courseId: string) => {
    const matching = nextUnits.filter((u) => u.courseId === courseId);
    if (matching.length === 0) return;
    const avg = Math.round(
      matching.reduce((acc, u) => acc + u.pacingPercent, 0) / matching.length
    );
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, pacingPercent: avg } : c))
    );
  };

  const handleToggleLessonComplete = (unitId: string, lessonId: string) => {
    let targetCourseId = '';
    setUnits((prev) => {
      const next = prev.map((u) => {
        if (u.id !== unitId) return u;
        targetCourseId = u.courseId;
        const nextLessons = u.lessons.map((l) =>
          l.id === lessonId ? { ...l, completed: !l.completed } : l
        );
        const doneCount = nextLessons.filter((l) => l.completed).length;
        const pct =
          nextLessons.length > 0
            ? Math.round((doneCount / nextLessons.length) * 100)
            : u.pacingPercent;
        const nextStatus: UnitStatus =
          pct === 100
            ? 'completed'
            : u.status === 'remediation'
            ? 'remediation'
            : pct > 0
            ? 'active'
            : 'scheduled';
        return {
          ...u,
          lessons: nextLessons,
          pacingPercent: pct,
          status: nextStatus,
        };
      });
      if (targetCourseId) {
        recalculateCoursePacing(next, targetCourseId);
      }
      return next;
    });
    notify('Lesson milestone updated and pacing recalculated.');
  };

  const handleUpdateUnitStatus = (unitId: string, status: UnitStatus) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              status,
              pacingPercent: status === 'completed' ? 100 : u.pacingPercent,
            }
          : u
      )
    );
    notify(`Unit status updated to ${status.replace('_', ' ')}.`);
  };

  const handleAddUnit = (unit: Omit<CurriculumUnit, 'id'>) => {
    const newUnit: CurriculumUnit = {
      ...unit,
      id: `unit-${Date.now()}`,
    };
    setUnits((prev) => {
      const next = [...prev, newUnit];
      recalculateCoursePacing(next, unit.courseId);
      return next;
    });
    notify(`Added "${unit.title}" to syllabus sequence.`);
  };

  const handleSubmitGrade = (
    submissionId: string,
    updatedRubric: StudentSubmission['rubric'],
    feedback: string,
    flagged: boolean
  ) => {
    const targetSub = submissions.find((s) => s.id === submissionId);
    const totalScore = updatedRubric.reduce((a, r) => a + r.score, 0);
    const totalMax = updatedRubric.reduce((a, r) => a + r.maxPoints, 0);
    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              rubric: updatedRubric,
              teacherFeedback: feedback,
              status: flagged ? 'flagged' : 'graded',
            }
          : s
      )
    );

    if (targetSub) {
      setStudents((prev) =>
        prev.map((stu) => {
          if (stu.id !== targetSub.studentId) return stu;
          const updatedAssessments = [
            {
              id: `ra-${submissionId}`,
              courseCode: targetSub.courseCode,
              title: targetSub.assignmentTitle,
              date: 'Nov 16, 2026',
              score: totalScore,
              maxScore: totalMax,
              status: flagged
                ? ('needs_review' as const)
                : percentage >= 88
                ? ('mastered' as const)
                : ('on_track' as const),
              feedback:
                feedback.trim() || 'Rubric evaluation published by instructor.',
            },
            ...stu.recentAssessments.filter((a) => a.id !== `ra-${submissionId}`),
          ];
          return {
            ...stu,
            flaggedForSupport: flagged ? true : stu.flaggedForSupport,
            recentAssessments: updatedAssessments,
          };
        })
      );
    }

    notify(
      flagged
        ? `Flagged ${targetSub?.studentName ?? 'submission'} for seminar workshop review.`
        : `Published grade (${totalScore}/${totalMax}) to student & parent record.`
    );
  };

  const handleToggleStudentSupportFlag = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, flaggedForSupport: !s.flaggedForSupport } : s
      )
    );
    notify('Updated student intervention support status.');
  };

  // Family handlers
  const handleToggleCheckpointPrepared = (studentId: string, checkpointId: string) => {
    setStudents((prev) =>
      prev.map((stu) =>
        stu.id === studentId
          ? {
              ...stu,
              upcomingCheckpoints: stu.upcomingCheckpoints.map((cp) =>
                cp.id === checkpointId ? { ...cp, prepared: !cp.prepared } : cp
              ),
            }
          : stu
      )
    );
  };

  const handleSendMessage = (
    studentId: string,
    courseCode: string,
    subject: string,
    body: string
  ) => {
    const newMsg: FacultyMessage = {
      id: `msg-${Date.now()}`,
      studentId,
      senderName: 'Lin Household (Parent)',
      senderRole: 'Parent',
      courseCode,
      subject,
      body,
      timestamp: 'Nov 16, 2026 · Just now',
      unread: false,
    };
    setMessages((prev) => [newMsg, ...prev]);
    notify(`Message sent to ${courseCode} instructor.`);
  };

  const handleMarkMessageRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, unread: false } : m))
    );
  };

  const handleResetDemoData = () => {
    setDepartments(INITIAL_DEPARTMENTS);
    setApprovals(INITIAL_APPROVALS);
    setCourses(INITIAL_COURSES);
    setUnits(INITIAL_UNITS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setStudents(INITIAL_STUDENTS);
    setMessages(INITIAL_MESSAGES);
    notify('Restored Fall Term 2026 baseline data.');
  };

  const pendingApprovalCount = approvals.filter((a) => a.status === 'pending').length;
  const pendingGradingCount = submissions.filter((s) => s.status === 'pending').length;
  const unreadMessageCount = messages.filter((m) => m.unread).length;

  return (
    <WorkspaceShell
      persona={persona}
      onSelectPersona={setPersona}
      principalTab={principalTab}
      onSelectPrincipalTab={setPrincipalTab}
      teacherTab={teacherTab}
      onSelectTeacherTab={setTeacherTab}
      familyTab={familyTab}
      onSelectFamilyTab={setFamilyTab}
      pendingApprovalCount={pendingApprovalCount}
      pendingGradingCount={pendingGradingCount}
      unreadMessageCount={unreadMessageCount}
      toastMessage={toastMessage}
      onResetDemoData={handleResetDemoData}
    >
      {persona === 'principal' && (
        <PrincipalView
          activeTab={principalTab}
          departments={departments}
          approvals={approvals}
          cohorts={cohorts}
          courses={courses}
          onApproveCurriculum={handleApproveCurriculum}
          onRequestRevision={handleRequestRevision}
        />
      )}

      {persona === 'teacher' && (
        <TeacherView
          activeTab={teacherTab}
          courses={courses}
          units={units}
          submissions={submissions}
          students={students}
          selectedCourseId={selectedCourseId}
          onSelectCourse={setSelectedCourseId}
          onToggleLessonComplete={handleToggleLessonComplete}
          onUpdateUnitStatus={handleUpdateUnitStatus}
          onAddUnit={handleAddUnit}
          onSubmitGrade={handleSubmitGrade}
          onToggleStudentSupportFlag={handleToggleStudentSupportFlag}
        />
      )}

      {persona === 'family' && (
        <FamilyView
          activeTab={familyTab}
          students={students}
          courses={courses}
          schedule={INITIAL_SCHEDULE}
          messages={messages}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
          onToggleCheckpointPrepared={handleToggleCheckpointPrepared}
          onSendMessage={handleSendMessage}
          onMarkMessageRead={handleMarkMessageRead}
        />
      )}
    </WorkspaceShell>
  );
}
