import React from 'react';
import { ChevronLeft } from './icons/ChevronLeft';
import { ChevronRight } from './icons/ChevronRight';

interface VersionNavigatorProps {
  currentVersion: number;
  totalVersions: number;
  onVersionChange: (versionIndex: number) => void;
  className?: string;
}

export default function VersionNavigator({
  currentVersion,
  totalVersions,
  onVersionChange,
  className = '',
}: VersionNavigatorProps) {
  const currentIndex = currentVersion - 1; // Convert to 0-based index
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalVersions - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onVersionChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onVersionChange(currentIndex + 1);
    }
  };

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
