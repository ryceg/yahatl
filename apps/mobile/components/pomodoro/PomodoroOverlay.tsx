/**
 * PomodoroOverlay Component
 *
 * Main Pomodoro UI controller that manages the expanded timer view
 * and minimized pill indicator. Renders as a portal overlay above
 * all other content.
 */
import * as React from 'react';
import { Portal } from '@rn-primitives/portal';
import { usePomodoroStore } from '@/lib/stores/pomodoroStore';
import { PomodoroTimer } from './PomodoroTimer';
import { PomodoroMinimized } from './PomodoroMinimized';

export function PomodoroOverlay() {
  // Store state and actions
  const isActive = usePomodoroStore((s) => s.isActive);
  const isExpanded = usePomodoroStore((s) => s.isExpanded);
  const toggleExpanded = usePomodoroStore((s) => s.toggleExpanded);

  // Don't render anything if timer is not active
  if (!isActive) {
    return null;
  }

  const handleMinimize = () => {
    toggleExpanded();
  };

  const handleExpand = () => {
    toggleExpanded();
  };

  return (
    <Portal>
      {/* Full Timer View (when expanded) */}
      {isExpanded && (
        <PomodoroTimer onMinimize={handleMinimize} />
      )}

      {/* Minimized Pill (when not expanded) */}
      <PomodoroMinimized onExpand={handleExpand} />
    </Portal>
  );
}

