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

interface UserMessageProps {
  message: Message;
  onEditMessage?: (messageId: string, newContent: MessageContent[]) => void;
}

export default function UserMessage({ message, onEditMessage }: UserMessageProps) {
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

  // Handle save edit
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

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText('');
  }, []);

  // Handle textarea key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

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
              />
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-600">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
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

              <div className="relative h-[22px] flex justify-end">
                <div className="absolute right-0 text-xs text-textSubtle pt-1 transition-all duration-200 group-hover:-translate-y-4 group-hover:opacity-0">
                  {timestamp}
                </div>
                <div className="absolute right-0 pt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {onEditMessage && (
                    <button
                      onClick={handleEditClick}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      aria-label="Edit message"
                      title="Edit message"
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
