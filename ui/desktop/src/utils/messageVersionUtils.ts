import { Message, MessageVersion, MessageContent } from '../types/message';

/**
 * Message Version Management Utilities
 * 
 * This module provides core functionality for managing message versions in the
 * Goose Desktop chat application. It enables users to edit messages and maintain
 * a history of all versions while showing only the active conversation branch.
 * 
 * Key Concepts:
 * - Each message can have multiple versions (edits)
 * - Only one version is active at a time (currentVersionIndex)
 * - Downstream messages are hidden when switching versions
 * - Active version path determines which messages are visible
 * 
 * @example
 * ```typescript
 * // Create a new version of a message
 * const editedMessage = createNewVersion(originalMessage, newContent);
 * 
 * // Switch to a different version
 * const switchedMessage = switchVersion(message, 0);
 * 
 * // Check if message has multiple versions
 * if (hasMultipleVersions(message)) {
 *   // Show version navigator
 * }
 * ```
 */

/**
 * Creates a new version of a message with updated content
 * 
 * This function preserves the original message content as version 1 (if no versions exist)
 * and adds the new content as the latest version. The message's currentVersionIndex
 * is updated to point to the new version.
 * 
 * @param message - The original message to create a version from
 * @param newContent - The new content for the message
 * @returns Updated message with new version added and currentVersionIndex set to latest
 * 
 * @example
 * ```typescript
 * const originalMessage = { id: '1', content: [{ type: 'text', text: 'Hello' }] };
 * const newContent = [{ type: 'text', text: 'Hello World' }];
 * const updatedMessage = createNewVersion(originalMessage, newContent);
 * // updatedMessage.versions.length === 2
 * // updatedMessage.currentVersionIndex === 1
 * ```
 */
export function createNewVersion(message: Message, newContent: MessageContent[]): Message {
  const currentContent = message.content;
  const currentTimestamp = message.created;
  
  // Create the first version from the original content if no versions exist
  const firstVersion: MessageVersion = {
    versionNumber: 1,
    content: currentContent,
    timestamp: currentTimestamp,
    childMessageIds: [], // Will be populated when we track child relationships
  };

  // Create the new version
  const newVersion: MessageVersion = {
    versionNumber: (message.versions?.length || 0) + 2, // +2 because we're adding the original as version 1
    content: newContent,
    timestamp: Math.floor(Date.now() / 1000),
    childMessageIds: [],
  };

  // Update the message
  const updatedMessage: Message = {
    ...message,
    content: newContent,
    versions: message.versions ? [...message.versions, newVersion] : [firstVersion, newVersion],
    currentVersionIndex: message.versions ? message.versions.length + 1 : 1, // Index of the new version
  };

  return updatedMessage;
}

/**
 * Switches a message to a specific version
 * 
 * This function changes the active version of a message by updating the content
 * and currentVersionIndex. It performs bounds checking to ensure the version
 * index is valid.
 * 
 * @param message - The message to switch versions for
 * @param versionIndex - The index of the version to switch to (0-based)
 * @returns Updated message with the specified version active, or unchanged if invalid index
 * 
 * @example
 * ```typescript
 * // Switch to the first version (original)
 * const firstVersion = switchVersion(message, 0);
 * 
 * // Switch to the second version (first edit)
 * const secondVersion = switchVersion(message, 1);
 * ```
 */
export function switchVersion(message: Message, versionIndex: number): Message {
  if (!message.versions || versionIndex < 0 || versionIndex >= message.versions.length) {
    return message;
  }

  const targetVersion = message.versions[versionIndex];
  
  return {
    ...message,
    content: targetVersion.content,
    currentVersionIndex: versionIndex,
  };
}

/**
 * Computes the active version path for a conversation
 * 
 * This function determines which messages should be visible based on the current
 * version selections. It filters out messages with display=false and returns
 * an array of message IDs that represent the active conversation branch.
 * 
 * In the future, this will be enhanced to handle complex version branching
 * and parent-child relationships between messages.
 * 
 * @param messages - Array of all messages in the conversation
 * @returns Array of message IDs that should be visible in the current version path
 * 
 * @example
 * ```typescript
 * const messages = [msg1, msg2, msg3];
 * const activePath = computeActiveVersionPath(messages);
 * // activePath = ['msg1', 'msg2', 'msg3'] (if all visible)
 * ```
 */
export function computeActiveVersionPath(messages: Message[]): string[] {
  const activePath: string[] = [];
  
  // For now, we'll include all messages that don't have display=false
  // This will be enhanced as we implement the full branching logic
  for (const message of messages) {
    if (message.display !== false && message.id) {
      activePath.push(message.id);
    }
  }
  
  return activePath;
}

/**
 * Gets the child message IDs for a specific message version
 * @param messageId - The ID of the parent message
 * @param versionIndex - The version index to get children for
 * @param messages - Array of all messages in the conversation
 * @returns Array of child message IDs for the specified version
 */
export function getChildMessageIds(
  messageId: string,
  versionIndex: number,
  messages: Message[]
): string[] {
  const childIds: string[] = [];
  
  // Find messages that have this message as their parent
  for (const message of messages) {
    if (message.parentMessageId === messageId && message.id) {
      childIds.push(message.id);
    }
  }
  
  return childIds;
}

/**
 * Hides downstream messages when a message is edited
 * @param editedMessageId - The ID of the message that was edited
 * @param messages - Array of all messages in the conversation
 * @returns Updated messages array with downstream messages hidden
 */
export function hideDownstreamMessages(
  editedMessageId: string,
  messages: Message[]
): Message[] {
  const editedMessageIndex = messages.findIndex(msg => msg.id === editedMessageId);
  if (editedMessageIndex === -1) {
    return messages;
  }

  // Hide all messages after the edited message
  return messages.map((message, index) => {
    if (index > editedMessageIndex) {
      return {
        ...message,
        display: false,
      };
    }
    return message;
  });
}

/**
 * Gets the display text for a version navigator
 * @param currentVersion - The current version number (1-based)
 * @param totalVersions - The total number of versions
 * @returns Formatted string like "< 2 / 3 >"
 */
export function getVersionNavigatorText(currentVersion: number, totalVersions: number): string {
  return `< ${currentVersion} / ${totalVersions} >`;
}

/**
 * Checks if a message has multiple versions
 * @param message - The message to check
 * @returns True if the message has multiple versions
 */
export function hasMultipleVersions(message: Message): boolean {
  return (message.versions?.length || 0) > 1;
}
