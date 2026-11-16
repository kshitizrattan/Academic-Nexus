import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Layers,
} from 'lucide-react';

export type SemanticState =
  | 'completed'
  | 'mastered'
  | 'ahead'
  | 'on_track'
  | 'active'
  | 'approved'
  | 'pending'
  | 'scheduled'
  | 'remediation'
  | 'attention'
  | 'flagged'
  | 'revision_requested'
  | 'graded'
  | 'needs_review';

interface StatusIndicatorProps {
  state: SemanticState;
  customLabel?: string;
}

const STATE_CONFIG: Record<
  SemanticState,
  { label: string; textClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  completed: {
    label: 'Completed',
    textClass: 'text-[#059669]',
    Icon: CheckCircle2,
  },
  mastered: {
    label: 'Mastered',
    textClass: 'text-[#059669]',
    Icon: CheckCircle2,
  },
  ahead: {
    label: 'Ahead of Schedule',
    textClass: 'text-[#059669]',
    Icon: CheckCircle2,
  },
  approved: {
    label: 'Approved',
    textClass: 'text-[#059669]',
    Icon: FileCheck2,
  },
  graded: {
    label: 'Graded',
    textClass: 'text-[#059669]',
    Icon: CheckCircle2,
  },
  on_track: {
    label: 'On Track',
    textClass: 'text-[#0051d5]',
    Icon: Layers,
  },
  active: {
    label: 'Active Pacing',
    textClass: 'text-[#0051d5]',
    Icon: Layers,
  },
  pending: {
    label: 'Pending Review',
    textClass: 'text-[#d97706]',
    Icon: Clock,
  },
  scheduled: {
    label: 'Scheduled',
    textClass: 'text-[#45474c]',
    Icon: Clock,
  },
  remediation: {
    label: 'Remediation Flag',
    textClass: 'text-[#d97706]',
    Icon: AlertTriangle,
  },
  attention: {
    label: 'Needs Review',
    textClass: 'text-[#d97706]',
    Icon: AlertTriangle,
  },
  flagged: {
    label: 'Intervention Flag',
    textClass: 'text-[#ba1a1a]',
    Icon: AlertTriangle,
  },
  needs_review: {
    label: 'Revision Recommended',
    textClass: 'text-[#d97706]',
    Icon: AlertTriangle,
  },
  revision_requested: {
    label: 'Revision Requested',
    textClass: 'text-[#ba1a1a]',
    Icon: AlertTriangle,
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state, customLabel }) => {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${cfg.textClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{customLabel ?? cfg.label}</span>
    </span>
  );
};
