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
 * When creating a new version, we also need to track which downstream messages
 * belong to the previous version so we can show/hide them appropriately.
 * 
 * @param message - The original message to create a version from
 * @param newContent - The new content for the message
 * @param downstreamMessageIds - IDs of messages that should be associated with the previous version
 * @returns Updated message with new version added and currentVersionIndex set to latest
 * 
 * @example
 * ```typescript
 * const originalMessage = { id: '1', content: [{ type: 'text', text: 'Hello' }] };
 * const newContent = [{ type: 'text', text: 'Hello World' }];
 * const downstreamIds = ['msg2', 'msg3']; // Messages that were responses to original
 * const updatedMessage = createNewVersion(originalMessage, newContent, downstreamIds);
 * // updatedMessage.versions.length === 2
 * // updatedMessage.currentVersionIndex === 1
 * // updatedMessage.versions[0].childMessageIds === ['msg2', 'msg3']
 * ```
 */
export function createNewVersion(
  message: Message, 
  newContent: MessageContent[], 
  downstreamMessageIds: string[] = []
): Message {
  const currentContent = message.content;
  const currentTimestamp = message.created;
  
  // Create the first version from the original content if no versions exist
  const firstVersion: MessageVersion = {
    versionNumber: 1,
    content: currentContent,
    timestamp: currentTimestamp,
    childMessageIds: downstreamMessageIds, // Track which messages belong to this version
  };

  // Create the new version
  const newVersion: MessageVersion = {
    versionNumber: (message.versions?.length || 0) + 1, // Fixed: +1 for sequential numbering
    content: newContent,
    timestamp: Math.floor(Date.now() / 1000),
    childMessageIds: [], // New version starts with no children
  };

  // Update the message
  const updatedMessage: Message = {
    ...message,
    content: newContent,
    versions: message.versions ? [...message.versions, newVersion] : [firstVersion, newVersion],
    currentVersionIndex: message.versions ? message.versions.length : 1, // Fixed: length gives us the new index
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
    console.warn('Invalid version index:', versionIndex, 'for message with', message.versions?.length || 0, 'versions');
    return message;
  }

  const targetVersion = message.versions[versionIndex];
  
  const updatedMessage = {
    ...message,
    content: targetVersion.content,
    currentVersionIndex: versionIndex,
  };
  
  console.log('Switched message to version:', versionIndex, 'content:', targetVersion.content);
  return updatedMessage;
}

/**
 * Computes the active version path for a conversation
 * 
 * This function determines which messages should be visible based on the current
 * version selections. It needs to track which conversation branches correspond
 * to each version of edited messages.
 * 
 * For now, this is a simplified implementation that shows all messages unless
 * they have display=false. A more sophisticated implementation would track
 * parent-child relationships and version-specific conversation branches.
 * 
 * @param messages - Array of all messages in the conversation
 * @param editedMessageId - Optional ID of message that was just edited
 * @param selectedVersionIndex - Optional version index that was selected
 * @returns Array of message IDs that should be visible in the current version path
 * 
 * @example
 * ```typescript
 * const messages = [msg1, msg2, msg3];
 * const activePath = computeActiveVersionPath(messages);
 * // activePath = ['msg1', 'msg2', 'msg3'] (if all visible)
 * ```
 */
export function computeActiveVersionPath(
  messages: Message[], 
  editedMessageId?: string, 
  selectedVersionIndex?: number
): string[] {
  const activePath: string[] = [];
  
  // If we have an edited message, we need to handle version-specific branching
  if (editedMessageId && selectedVersionIndex !== undefined) {
    const editedMessageIndex = messages.findIndex(msg => msg.id === editedMessageId);
    
    if (editedMessageIndex !== -1) {
      const editedMessage = messages[editedMessageIndex];
      
      // Validate the version index
      if (!editedMessage.versions || selectedVersionIndex < 0 || selectedVersionIndex >= editedMessage.versions.length) {
        console.warn('Invalid version index for computeActiveVersionPath:', selectedVersionIndex, 'available versions:', editedMessage.versions?.length || 0);
        // Fall back to default behavior
      } else {
        // Include all messages up to and including the edited message
        for (let i = 0; i <= editedMessageIndex; i++) {
          const message = messages[i];
          if (message.display !== false && message.id) {
            activePath.push(message.id);
          }
        }
        
        // For messages after the edited message, include those that belong to this version
        const selectedVersion = editedMessage.versions[selectedVersionIndex];
        
        console.log('Computing active path for version', selectedVersionIndex, 'with child messages:', selectedVersion.childMessageIds);
        
        // Include child messages that belong to this version
        for (const childId of selectedVersion.childMessageIds) {
          if (!activePath.includes(childId)) {
            // Verify the message still exists and is visible
            const childMessage = messages.find(m => m.id === childId);
            if (childMessage && childMessage.display !== false) {
              activePath.push(childId);
            }
          }
        }
        
        console.log('Active path for version', selectedVersionIndex, ':', activePath);
        return activePath;
      }
    }
  }
  
  // Default behavior: include all messages that don't have display=false
  for (const message of messages) {
    if (message.display !== false && message.id) {
      activePath.push(message.id);
    }
  }
  
  console.log('Default active path:', activePath);
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
 * Restores messages that were hidden for a specific version
 * @param messageId - The ID of the message whose version is being switched
 * @param versionIndex - The version index being switched to
 * @param messages - Array of all messages in the conversation
 * @returns Updated messages array with appropriate messages restored/hidden
 */
export function restoreMessagesForVersion(
  messageId: string,
  versionIndex: number,
  messages: Message[]
): Message[] {
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) {
    console.warn('Message not found for restoreMessagesForVersion:', messageId);
    return messages;
  }

  const message = messages[messageIndex];
  if (!message.versions || versionIndex < 0 || versionIndex >= message.versions.length) {
    console.warn('Invalid version index for restoreMessagesForVersion:', versionIndex, 'available versions:', message.versions?.length || 0);
    return messages;
  }

  const selectedVersion = message.versions[versionIndex];
  console.log('Restoring messages for version', versionIndex, 'with child messages:', selectedVersion.childMessageIds);
  
  const updatedMessages = messages.map((msg, index) => {
    // Don't modify messages before the edited message
    if (index <= messageIndex) {
      return msg;
    }
    
    // For messages after the edited message, show them if they belong to this version
    if (msg.id && selectedVersion.childMessageIds.includes(msg.id)) {
      console.log('Restoring message:', msg.id);
      return {
        ...msg,
        display: true, // Make sure they're visible
      };
    } else {
      // Hide messages that don't belong to this version
      if (msg.display !== false) {
        console.log('Hiding message:', msg.id);
      }
      return {
        ...msg,
        display: false,
      };
    }
  });
  
  console.log('Restored messages, visible count:', updatedMessages.filter(m => m.display !== false).length);
  return updatedMessages;
}

/**
 * Checks if a message has multiple versions
 * @param message - The message to check
 * @returns True if the message has multiple versions
 */
export function hasMultipleVersions(message: Message): boolean {
  return (message.versions?.length || 0) > 1;
}
