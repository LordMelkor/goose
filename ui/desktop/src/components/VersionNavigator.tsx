import React from 'react';
import { ChevronLeft } from './icons/ChevronLeft';
import { ChevronRight } from './icons/ChevronRight';

/**
 * VersionNavigator Component
 * 
 * A navigation control for switching between different versions of an edited message.
 * Displays the current version number and total versions in the format "< n / total >"
 * with clickable arrows to navigate between versions.
 * 
 * Features:
 * - Previous/Next navigation buttons with chevron icons
 * - Automatic disabling of buttons at boundaries (first/last version)
 * - Keyboard navigation support (Enter/Space to activate)
 * - Full accessibility with ARIA labels and proper focus management
 * - Responsive design that works with different themes
 * 
 * @example
 * ```tsx
 * <VersionNavigator
 *   currentVersion={2}
 *   totalVersions={3}
 *   onVersionChange={(index) => switchToVersion(index)}
 * />
 * ```
 */

interface VersionNavigatorProps {
  /** Current version number (1-based) */
  currentVersion: number;
  /** Total number of versions available */
  totalVersions: number;
  /** Callback fired when user navigates to a different version (0-based index) */
  onVersionChange: (versionIndex: number) => void;
  /** Additional CSS classes to apply */
  className?: string;
}

export default function VersionNavigator({
  currentVersion,
  totalVersions,
  onVersionChange,
  className = '',
}: VersionNavigatorProps) {
  // Convert 1-based version to 0-based index for internal logic
  const currentIndex = currentVersion - 1;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalVersions - 1;

  console.log('VersionNavigator render:', {
    currentVersion,
    totalVersions,
    currentIndex,
    canGoPrevious,
    canGoNext
  });

  // Handle previous version navigation
  const handlePrevious = () => {
    console.log('VersionNavigator: handlePrevious clicked, canGoPrevious:', canGoPrevious);
    if (canGoPrevious) {
      const newIndex = currentIndex - 1;
      console.log('VersionNavigator: calling onVersionChange with index:', newIndex);
      onVersionChange(newIndex);
    }
  };

  // Handle next version navigation
  const handleNext = () => {
    console.log('VersionNavigator: handleNext clicked, canGoNext:', canGoNext);
    if (canGoNext) {
      const newIndex = currentIndex + 1;
      console.log('VersionNavigator: calling onVersionChange with index:', newIndex);
      onVersionChange(newIndex);
    }
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs text-textSubtle ${className}`}>
      <button
        onClick={handlePrevious}
        onKeyDown={(e) => handleKeyDown(e, handlePrevious)}
        disabled={!canGoPrevious}
        className={`p-1 rounded transition-colors ${
          canGoPrevious
            ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-textSubtle hover:text-textStandard'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Previous version"
        title="Previous version"
        tabIndex={canGoPrevious ? 0 : -1}
      >
        <ChevronLeft className="w-3 h-3" />
      </button>
      
      <span className="px-1 font-mono select-none" aria-label={`Version ${currentVersion} of ${totalVersions}`}>
        {currentVersion} / {totalVersions}
      </span>
      
      <button
        onClick={handleNext}
        onKeyDown={(e) => handleKeyDown(e, handleNext)}
        disabled={!canGoNext}
        className={`p-1 rounded transition-colors ${
          canGoNext
            ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-textSubtle hover:text-textStandard'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Next version"
        title="Next version"
        tabIndex={canGoNext ? 0 : -1}
      >
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
