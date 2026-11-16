import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  Mail,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  FamilyTab,
  PersonaRole,
  PrincipalTab,
  TeacherTab,
} from '../../types/academic';

interface WorkspaceShellProps {
  persona: PersonaRole;
  onSelectPersona: (role: PersonaRole) => void;
  principalTab: PrincipalTab;
  onSelectPrincipalTab: (tab: PrincipalTab) => void;
  teacherTab: TeacherTab;
  onSelectTeacherTab: (tab: TeacherTab) => void;
  familyTab: FamilyTab;
  onSelectFamilyTab: (tab: FamilyTab) => void;
  pendingApprovalCount: number;
  pendingGradingCount: number;
  unreadMessageCount: number;
  toastMessage: string | null;
  onResetDemoData: () => void;
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  persona,
  onSelectPersona,
  principalTab,
  onSelectPrincipalTab,
  teacherTab,
  onSelectTeacherTab,
  familyTab,
  onSelectFamilyTab,
  pendingApprovalCount,
  pendingGradingCount,
  unreadMessageCount,
  toastMessage,
  onResetDemoData,
  children,
}) => {
  const personaMeta: Record<
    PersonaRole,
    { label: string; userName: string; roleTitle: string; initials: string }
  > = {
    principal: {
      label: 'Principal',
      userName: 'Dr. Evelyn Vance',
      roleTitle: 'Head of School',
      initials: 'EV',
    },
    teacher: {
      label: 'Teacher',
      userName: 'Dr. Aris Thorne',
      roleTitle: 'STEM Chair · Faculty',
      initials: 'AT',
    },
    family: {
      label: 'Parent & Student',
      userName: 'Lin Household',
      roleTitle: 'Maya (Gr 11) & Leo (Gr 10)',
      initials: 'LH',
    },
  };

  const navItems =
    persona === 'principal'
      ? [
          {
            id: 'overview',
            label: 'Institutional Overview',
            count: pendingApprovalCount,
            Icon: LayoutDashboard,
            active: principalTab === 'overview',
            onClick: () => onSelectPrincipalTab('overview'),
          },
          {
            id: 'faculty',
            label: 'Faculty & Compliance',
            count: 0,
            Icon: ShieldCheck,
            active: principalTab === 'faculty',
            onClick: () => onSelectPrincipalTab('faculty'),
          },
          {
            id: 'cohorts',
            label: 'Cohort Analytics',
            count: 0,
            Icon: Users,
            active: principalTab === 'cohorts',
            onClick: () => onSelectPrincipalTab('cohorts'),
          },
        ]
      : persona === 'teacher'
      ? [
          {
            id: 'pacing',
            label: 'Curriculum Pacing',
            count: 0,
            Icon: BookOpen,
            active: teacherTab === 'pacing',
            onClick: () => onSelectTeacherTab('pacing'),
          },
          {
            id: 'grading',
            label: 'Rubric Grading Queue',
            count: pendingGradingCount,
            Icon: CheckSquare,
            active: teacherTab === 'grading',
            onClick: () => onSelectTeacherTab('grading'),
          },
          {
            id: 'roster',
            label: 'Class Roster',
            count: 0,
            Icon: Users,
            active: teacherTab === 'roster',
            onClick: () => onSelectTeacherTab('roster'),
          },
        ]
      : [
          {
            id: 'progress',
            label: 'Academic Progress',
            count: 0,
            Icon: GraduationCap,
            active: familyTab === 'progress',
            onClick: () => onSelectFamilyTab('progress'),
          },
          {
            id: 'schedule',
            label: 'Schedule & Labs',
            count: 0,
            Icon: CalendarDays,
            active: familyTab === 'schedule',
            onClick: () => onSelectFamilyTab('schedule'),
          },
          {
            id: 'messages',
            label: 'Faculty Messages',
            count: unreadMessageCount,
            Icon: Mail,
            active: familyTab === 'messages',
            onClick: () => onSelectFamilyTab('messages'),
          },
        ];

  const activeNavLabel = navItems.find((n) => n.active)?.label ?? '';
  const currentUser = personaMeta[persona];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col md:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-68 shrink-0 bg-white border-r border-[#e2e8f0] flex-col justify-between">
        <div className="p-5 space-y-7">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-lg bg-[#091426] text-white flex items-center justify-center font-display font-bold text-sm tracking-tight shrink-0">
              AN
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[#091426] whitespace-nowrap">
              Academic Nexus
            </span>
          </div>

          {/* Persona Role Switcher */}
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold text-[#75777d] tracking-wide">
              Workspace Persona
            </p>
            <div className="space-y-1">
              {(['principal', 'teacher', 'family'] as PersonaRole[]).map((role) => {
                const isSelected = persona === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onSelectPersona(role)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#091426] text-white'
                        : 'text-[#45474c] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                    }`}
                  >
                    <span>{personaMeta[role].label}</span>
                    <span
                      className={`text-[11px] font-normal ${
                        isSelected ? 'text-[#bcc7de]' : 'text-[#75777d]'
                      }`}
                    >
                      {role === 'principal'
                        ? 'Oversight'
                        : role === 'teacher'
                        ? 'Pacing'
                        : 'Progress'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Navigation */}
          <nav aria-label="Workspace Sections" className="space-y-1.5">
            <p className="px-1 text-[11px] font-semibold text-[#75777d] tracking-wide">
              Views
            </p>
            {navItems.map((item) => {
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    item.active
                      ? 'bg-[#eff4ff] text-[#0051d5] font-semibold'
                      : 'text-[#45474c] hover:bg-[#f8f9ff] hover:text-[#0b1c30]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count > 0 && (
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#0051d5]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Active Profile */}
        <div className="p-4 border-t border-[#f1f5f9] space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-lg bg-[#eff4ff] border border-[#dce9ff] text-[#0051d5] font-display font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0b1c30] truncate">
                {currentUser.userName}
              </p>
              <p className="text-[11px] text-[#45474c] truncate">
                {currentUser.roleTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetDemoData}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#45474c] hover:text-[#0b1c30] hover:bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset Term Data
          </button>
        </div>
      </aside>

      {/* Right Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Workspace Header */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] px-4 sm:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="md:hidden font-display font-bold text-base text-[#091426] whitespace-nowrap">
              Academic Nexus
            </span>
            <span className="hidden md:inline text-xs text-[#45474c] truncate">
              Academic Nexus / {currentUser.label} /{' '}
              <span className="font-semibold text-[#0b1c30]">{activeNavLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Persona Quick Select */}
            <select
              aria-label="Switch workspace persona"
              value={persona}
              onChange={(e) => onSelectPersona(e.target.value as PersonaRole)}
              className="md:hidden px-2.5 py-1.5 text-xs font-semibold bg-[#eff4ff] border border-[#dce9ff] rounded-lg text-[#0b1c30]"
            >
              <option value="principal">Principal</option>
              <option value="teacher">Teacher</option>
              <option value="family">Parent &amp; Student</option>
            </select>

            <span className="hidden sm:inline text-xs font-mono tabular-nums text-[#45474c] whitespace-nowrap">
              Nov 16, 2026 · Term Week 11
            </span>
          </div>
        </header>

        {/* Action Toast Feedback */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mx-4 sm:mx-8 mt-4 px-4 py-2.5 bg-[#091426] text-white text-xs font-medium rounded-lg flex items-center justify-between"
          >
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<= 15% viewport height) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#e2e8f0] px-2 py-1.5 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                item.active ? 'text-[#0051d5]' : 'text-[#45474c]'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="truncate max-w-[96px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
