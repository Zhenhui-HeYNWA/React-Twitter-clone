import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const RenderText = ({ text }) => {
  const [mentionedUsersExistence, setMentionedUsersExistence] = useState({});
  const navigate = useNavigate();

  // Memoize the fetch function
  const fetchMentionedExistence = useCallback(async (usernames) => {
    try {
      const res = await fetch('/api/users/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernames }),
      });

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching mentioned users:', error);
      return {}; // Return an empty object in case of error
    }
  });

  useEffect(() => {
    const mentionedUsernames = [];

    // Check for mentions in post text
    if (text) {
      mentionedUsernames.push(...(text.match(/@\w+/g) || []));
    }

    // Remove the '@' symbol from the usernames
    const usernamesWithoutAt = mentionedUsernames.map((m) => m.substring(1));

    // If there are mentions, fetch user existence
    if (usernamesWithoutAt.length > 0) {
      fetchMentionedExistence(usernamesWithoutAt).then((data) => {
        setMentionedUsersExistence(data);
      });
    }
  }, [text, fetchMentionedExistence]);

  const highlightMentions = (text) => {
    const regex = /@\w+/g;

    const handleClick = (e, path) => {
      e.stopPropagation();
      navigate(path);
    };

    return text?.split(regex).reduce((acc, part, index) => {
      if (index === 0) {
        return [part];
      }
      const match = text.match(regex)[index - 1];
      const mentionedUsername = match.substring(1);

      if (mentionedUsersExistence[mentionedUsername]) {
        acc.push(
          <span
            key={uuidv4()}
            className='mentioned-highlight text-sky-500 hover:underline hover:text-sky-700 cursor-pointer'
            onClick={(e) => handleClick(e, `/profile/${mentionedUsername}`)}>
            {match}
          </span>
        );
      } else {
        acc.push(<span key={uuidv4()}>{match}</span>);
      }
      acc.push(part);
      return acc;
    }, []);
  };

  return <div>{highlightMentions(text)}</div>;
};

export default RenderText;
