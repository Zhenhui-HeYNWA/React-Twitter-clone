import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const RenderText = ({ text }) => {
  const [mentionedUsersExistence, setMentionedUsersExistence] = useState({});
  const navigate = useNavigate();

  // Memoize the fetch function with the correct dependency array
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
  }, []); // Add an empty dependency array to ensure this function is memoized

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
  }, [text, fetchMentionedExistence]); // Add fetchMentionedExistence as a dependency

  // Regex to detect URLs
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;

  const highlightMentionsAndUrls = (text) => {
    // First, replace URLs with clickable links
    const parts = text.split(urlRegex);

    return parts.reduce((acc, part, index) => {
      // Process mentions
      const regex = /@\w+/g;
      const handleClick = (e, path) => {
        e.stopPropagation();
        navigate(path);
      };

      // Find URL matches
      const matchUrl = text.match(urlRegex);
      const url = matchUrl ? matchUrl[index - 1] : null;

      // Handle URL
      if (url) {
        acc.push(
          <a
            key={uuidv4()}
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 hover:underline'>
            {url}
          </a>
        );
      }

      // Process mentions
      const mentionParts = part
        .split(regex)
        .reduce((subAcc, subPart, subIndex) => {
          if (subIndex === 0) {
            return [subPart];
          }

          const match = part.match(regex)[subIndex - 1];
          const mentionedUsername = match.substring(1);

          if (mentionedUsersExistence[mentionedUsername]) {
            subAcc.push(
              <span
                key={uuidv4()}
                className='mentioned-highlight text-sky-500 hover:underline hover:text-sky-700 cursor-pointer'
                onClick={(e) =>
                  handleClick(e, `/profile/${mentionedUsername}`)
                }>
                {match}
              </span>
            );
          } else {
            subAcc.push(<span key={uuidv4()}>{match}</span>);
          }
          subAcc.push(subPart);
          return subAcc;
        }, []);

      return acc.concat(mentionParts);
    }, []);
  };

  return <div>{highlightMentionsAndUrls(text)}</div>;
};

export default RenderText;
