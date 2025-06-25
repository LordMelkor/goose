import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VersionNavigator from '../../src/components/VersionNavigator';

// Mock the chevron icons
vi.mock('../../src/components/icons/ChevronLeft', () => ({
  ChevronLeft: ({ className }: { className?: string }) => (
    <div data-testid="chevron-left" className={className}>←</div>
  ),
}));

vi.mock('../../src/components/icons/ChevronRight', () => ({
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron-right" className={className}>→</div>
  ),
}));

describe('VersionNavigator', () => {
  const mockOnVersionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('should display current version and total versions', () => {
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={5}
          onVersionChange={mockOnVersionChange}
        />
      );

      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });

    it('should display navigation buttons', () => {
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={5}
          onVersionChange={mockOnVersionChange}
        />
      );

      expect(screen.getByRole('button', { name: /previous version/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next version/i })).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Navigation Logic', () => {
    it('should enable previous button when not at first version', () => {
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      expect(previousButton).not.toBeDisabled();
      expect(previousButton).toHaveAttribute('tabIndex', '0');
    });

    it('should disable previous button when at first version', () => {
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      expect(previousButton).toBeDisabled();
      expect(previousButton).toHaveAttribute('tabIndex', '-1');
    });

    it('should enable next button when not at last version', () => {
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next version/i });
      expect(nextButton).not.toBeDisabled();
      expect(nextButton).toHaveAttribute('tabIndex', '0');
    });

    it('should disable next button when at last version', () => {
      render(
        <VersionNavigator
          currentVersion={3}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next version/i });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Click Interactions', () => {
    it('should call onVersionChange with previous index when previous button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={3}
          totalVersions={5}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      await user.click(previousButton);

      expect(mockOnVersionChange).toHaveBeenCalledWith(1); // 0-based index for version 2
    });

    it('should call onVersionChange with next index when next button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={5}
          onVersionChange={mockOnVersionChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next version/i });
      await user.click(nextButton);

      expect(mockOnVersionChange).toHaveBeenCalledWith(2); // 0-based index for version 3
    });

    it('should not call onVersionChange when disabled previous button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      await user.click(previousButton);

      expect(mockOnVersionChange).not.toHaveBeenCalled();
    });

    it('should not call onVersionChange when disabled next button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={3}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next version/i });
      await user.click(nextButton);

      expect(mockOnVersionChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should handle Enter key on previous button', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      previousButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnVersionChange).toHaveBeenCalledWith(0);
    });

    it('should handle Space key on next button', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next version/i });
      nextButton.focus();
      await user.keyboard(' ');

      expect(mockOnVersionChange).toHaveBeenCalledWith(1);
    });

    it('should not handle keyboard events on disabled buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      previousButton.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(mockOnVersionChange).not.toHaveBeenCalled();
    });

    it('should ignore other keyboard events', async () => {
      const user = userEvent.setup();
      
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      previousButton.focus();
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('a');

      expect(mockOnVersionChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={5}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      const nextButton = screen.getByRole('button', { name: /next version/i });
      const versionText = screen.getByText('2 / 5');

      expect(previousButton).toHaveAttribute('aria-label', 'Previous version');
      expect(previousButton).toHaveAttribute('title', 'Previous version');
      expect(nextButton).toHaveAttribute('aria-label', 'Next version');
      expect(nextButton).toHaveAttribute('title', 'Next version');
      expect(versionText).toHaveAttribute('aria-label', 'Version 2 of 5');
    });

    it('should have proper tabIndex for enabled buttons', () => {
      render(
        <VersionNavigator
          currentVersion={2}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      const nextButton = screen.getByRole('button', { name: /next version/i });

      expect(previousButton).toHaveAttribute('tabIndex', '0');
      expect(nextButton).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper tabIndex for disabled buttons', () => {
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={1}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      const nextButton = screen.getByRole('button', { name: /next version/i });

      expect(previousButton).toHaveAttribute('tabIndex', '-1');
      expect(nextButton).toHaveAttribute('tabIndex', '-1');
    });

    it('should have proper styling for disabled state', () => {
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={1}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      const nextButton = screen.getByRole('button', { name: /next version/i });

      expect(previousButton).toHaveClass('cursor-not-allowed');
      expect(nextButton).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single version case', () => {
      render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={1}
          onVersionChange={mockOnVersionChange}
        />
      );

      expect(screen.getByText('1 / 1')).toBeInTheDocument();
      
      const previousButton = screen.getByRole('button', { name: /previous version/i });
      const nextButton = screen.getByRole('button', { name: /next version/i });
      
      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should handle large version numbers', () => {
      render(
        <VersionNavigator
          currentVersion={99}
          totalVersions={100}
          onVersionChange={mockOnVersionChange}
        />
      );

      expect(screen.getByText('99 / 100')).toBeInTheDocument();
    });

    it('should handle version boundaries correctly', async () => {
      const user = userEvent.setup();
      
      // Test at first version
      const { rerender } = render(
        <VersionNavigator
          currentVersion={1}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      let nextButton = screen.getByRole('button', { name: /next version/i });
      await user.click(nextButton);
      expect(mockOnVersionChange).toHaveBeenCalledWith(1);

      // Test at last version
      mockOnVersionChange.mockClear();
      rerender(
        <VersionNavigator
          currentVersion={3}
          totalVersions={3}
          onVersionChange={mockOnVersionChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous version/i });
      await user.click(previousButton);
      expect(mockOnVersionChange).toHaveBeenCalledWith(1);
    });
  });
});
