import User from '../../models/user.model.js';
import Notification from '../../models/notification.model.js';

/**
 * Function to handle mentions in a given text.
 * Detects mentions, finds the mentioned user, and sends a notification.
 *
 * @param {string} text - The text containing mentions.
 * @param {string} userId - The ID of the user who mentioned someone.
 * @returns {Promise<void>}
 */
export const handleMentions = async (text, userId) => {
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedUsername = match[1];
    try {
      const mentionedUser = await User.findOne({ username: mentionedUsername });

      if (mentionedUser) {
        const notification = new Notification({
          from: userId,
          to: mentionedUser._id,
          type: 'mention',
        });
        await notification.save();
      }
    } catch (error) {
      console.error(
        `Failed to process mention for user: ${mentionedUsername}`,
        error
      );
    }
  }
};
