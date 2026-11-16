export type PersonaRole = 'principal' | 'teacher' | 'family';

export type PrincipalTab = 'overview' | 'faculty' | 'cohorts';
export type TeacherTab = 'pacing' | 'grading' | 'roster';
export type FamilyTab = 'progress' | 'schedule' | 'messages';

export type UnitStatus = 'completed' | 'active' | 'scheduled' | 'remediation';
export type ApprovalStatus = 'pending' | 'approved' | 'revision_requested';
export type SubmissionStatus = 'pending' | 'graded' | 'flagged';

export interface DepartmentSummary {
  id: string;
  name: string;
  chair: string;
  facultyCount: number;
  coursesCount: number;
  pacingRate: number;
  masteryRate: number;
  attendanceDelta: string;
  status: 'on_track' | 'attention' | 'ahead';
  notes: string;
}

export interface CurriculumApproval {
  id: string;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  department: string;
  unitTitle: string;
  submittedDate: string;
  pacingImpact: string;
  status: ApprovalStatus;
  summary: string;
  reviewerNote?: string;
}

export interface CohortMetric {
  id: string;
  gradeLabel: string;
  enrolledCount: number;
  attendanceRate: number;
  masteryRate: number;
  onTrackCount: number;
  remediationCount: number;
  leadAdvisor: string;
  focusArea: string;
}

export interface LessonItem {
  id: string;
  title: string;
  durationMinutes: number;
  modality: 'Seminar' | 'Laboratory' | 'Workshop' | 'Assessment';
  completed: boolean;
}

export interface CurriculumUnit {
  id: string;
  courseId: string;
  term: 'Fall Term 2026' | 'Spring Term 2027';
  unitNumber: number;
  title: string;
  dateRange: string;
  standardsCode: string;
  pacingPercent: number;
  status: UnitStatus;
  objectives: string;
  lessons: LessonItem[];
}

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  department: string;
  gradeLevel: string;
  teacherName: string;
  enrolledCount: number;
  pacingPercent: number;
  averageMastery: number;
  room: string;
  scheduleSlot: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  maxPoints: number;
  score: number;
  descriptor: string;
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  assignmentTitle: string;
  submittedAt: string;
  status: SubmissionStatus;
  excerpt: string;
  rubric: RubricCriterion[];
  teacherFeedback: string;
}

export interface RosterStudent {
  id: string;
  name: string;
  gradeLevel: string;
  courseIds: string[];
  attendanceRate: number;
  masteryScore: number;
  gpa: string;
  advisor: string;
  flaggedForSupport: boolean;
  supportNote: string;
  recentAssessments: {
    id: string;
    courseCode: string;
    title: string;
    date: string;
    score: number;
    maxScore: number;
    status: 'mastered' | 'on_track' | 'needs_review';
    feedback: string;
  }[];
  upcomingCheckpoints: {
    id: string;
    courseCode: string;
    title: string;
    dueDate: string;
    weight: string;
    type: 'Exam' | 'Lab Report' | 'Seminar Paper' | 'Quiz';
    prepared: boolean;
  }[];
}

export interface ScheduleBlock {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  time: string;
  courseCode: string;
  courseTitle: string;
  room: string;
  teacherName: string;
  focusTopic: string;
}

export interface FacultyMessage {
  id: string;
  studentId: string;
  senderName: string;
  senderRole: 'Teacher' | 'Parent' | 'Principal';
  courseCode: string;
  subject: string;
  body: string;
  timestamp: string;
  unread: boolean;
}
