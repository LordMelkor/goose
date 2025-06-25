import { useRef, useMemo, useState, useCallback } from 'react';
import LinkPreview from './LinkPreview';
import ImagePreview from './ImagePreview';
import { extractUrls } from '../utils/urlUtils';
import { extractImagePaths, removeImagePathsFromText } from '../utils/imageUtils';
import MarkdownContent from './MarkdownContent';
import { Message, getTextContent, MessageContent } from '../types/message';
import MessageCopyLink from './MessageCopyLink';
import { formatMessageTimestamp } from '../utils/timeUtils';
import Edit from './icons/Edit';
import VersionNavigator from './VersionNavigator';
import { hasMultipleVersions } from '../utils/messageVersionUtils';

/**
 * UserMessage Component with Edit Functionality
 * 
 * This component renders user messages in the chat interface with support for
 * in-place editing and version navigation. It provides a rich editing experience
 * with keyboard shortcuts and accessibility features.
 * 
 * Features:
 * - Edit icon appears on hover
 * - In-place editing with textarea
 * - Keyboard shortcuts (Enter to save, Escape to cancel, Shift+Enter for newlines)
 * - Version navigator for messages with multiple versions
 * - Full accessibility support with ARIA labels and focus management
 * 
 * @example
 * ```tsx
 * <UserMessage 
 *   message={message}
 *   onEditMessage={(id, content) => editMessage(id, content)}
 *   onSwitchVersion={(id, index) => switchVersion(id, index)}
 * />
 * ```
 */

interface UserMessageProps {
  /** The message to display */
  message: Message;
  /** Callback fired when user saves an edit */
  onEditMessage?: (messageId: string, newContent: MessageContent[]) => void;
  /** Callback fired when user switches to a different version */
  onSwitchVersion?: (messageId: string, versionIndex: number) => void;
}

export default function UserMessage({ message, onEditMessage, onSwitchVersion }: UserMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Extract text content from the message
  const textContent = getTextContent(message);

  // Extract image paths from the message
  const imagePaths = extractImagePaths(textContent);

  // Remove image paths from text for display
  const displayText = removeImagePathsFromText(textContent, imagePaths);

  // Memoize the timestamp
  const timestamp = useMemo(() => formatMessageTimestamp(message.created), [message.created]);

  // Extract URLs which explicitly contain the http:// or https:// protocol
  const urls = extractUrls(displayText, []);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setEditText(displayText);
    setIsEditing(true);
  }, [displayText]);

  // Handle save edit - creates new version and triggers AI response
  const handleSaveEdit = useCallback(() => {
    if (onEditMessage && message.id && editText.trim() !== displayText) {
      const newContent: MessageContent[] = [
        {
          type: 'text',
          text: editText.trim(),
        }
      ];
      onEditMessage(message.id, newContent);
    }
    setIsEditing(false);
  }, [onEditMessage, message.id, editText, displayText]);

  // Handle cancel edit - discards changes and exits edit mode
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText('');
  }, []);

  // Handle version change - switches to different version of message
  const handleVersionChange = useCallback((versionIndex: number) => {
    console.log('VersionNavigator: handleVersionChange called with versionIndex:', versionIndex);
    console.log('Message ID:', message.id, 'Current versions:', message.versions?.length);
    console.log('Current currentVersionIndex:', message.currentVersionIndex);
    
    if (onSwitchVersion && message.id) {
      onSwitchVersion(message.id, versionIndex);
    } else {
      console.error('Cannot switch version: missing onSwitchVersion or message.id');
    }
  }, [onSwitchVersion, message.id, message.versions?.length, message.currentVersionIndex]);

  // Handle textarea key events for keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without Shift = save edit
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      // Escape = cancel edit
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === 'Tab') {
      // Allow normal tab behavior for accessibility
      return;
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Handle edit button key events for accessibility
  const handleEditButtonKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleEditClick();
    }
  }, [handleEditClick]);

  return (
    <div className="flex justify-end mt-[16px] w-full opacity-0 animate-[appear_150ms_ease-in_forwards]">
      <div className="flex-col max-w-[85%]">
        <div className="flex flex-col group">
          {isEditing ? (
            // Edit mode
            <div className="flex flex-col bg-slate text-white rounded-xl rounded-br-none py-2 px-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-white resize-none border-none outline-none min-h-[60px] font-inherit"
                autoFocus
                placeholder="Edit your message..."
                aria-label="Edit message content"
                rows={3}
              />
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-600">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Save edited message"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Display mode
            <>
              <div className="flex bg-slate text-white rounded-xl rounded-br-none py-2 px-3">
                <div ref={contentRef}>
                  <MarkdownContent
                    content={displayText}
                    className="text-white prose-a:text-white user-message"
                  />
                </div>
              </div>

              {/* Render images if any */}
              {imagePaths.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePaths.map((imagePath, index) => (
                    <ImagePreview key={index} src={imagePath} alt={`Pasted image ${index + 1}`} />
                  ))}
                </div>
              )}

              {/* Version Navigator */}
              {hasMultipleVersions(message) && (
                <div className="flex justify-end mt-1">
                  <VersionNavigator
                    currentVersion={(message.currentVersionIndex ?? 0) + 1}
                    totalVersions={message.versions?.length || 1}
                    onVersionChange={handleVersionChange}
                    className="text-xs"
                  />
                  {/* Debug info */}
                  <div className="ml-2 text-xs text-gray-500">
                    Debug: idx={message.currentVersionIndex}, vers={message.versions?.length}
                  </div>
                </div>
              )}

              <div className="relative h-[22px] flex justify-end">
                <div className="absolute right-0 text-xs text-textSubtle pt-1 transition-all duration-200 group-hover:-translate-y-4 group-hover:opacity-0">
                  {timestamp}
                </div>
                <div className="absolute right-0 pt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {onEditMessage && (
                    <button
                      onClick={handleEditClick}
                      onKeyDown={handleEditButtonKeyDown}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Edit message"
                      title="Edit message (Enter or Space to activate)"
                      tabIndex={0}
                    >
                      <Edit className="w-4 h-4 text-textSubtle hover:text-textStandard" />
                    </button>
                  )}
                  <MessageCopyLink text={displayText} contentRef={contentRef} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* TODO(alexhancock): Re-enable link previews once styled well again */}
        {false && urls.length > 0 && (
          <div className="flex flex-wrap mt-2">
            {urls.map((url, index) => (
              <LinkPreview key={index} url={url} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
