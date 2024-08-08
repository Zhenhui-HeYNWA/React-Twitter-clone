import { Link } from 'react-router-dom';

const userHighlightMentions = (text, username) => {
  const regex = /@\w+/g; // Regex to find mentions in the text
  return text.split(regex).map((part, index) => {
    const match = text.match(regex)?.[index];
    if (match) {
      return (
        <Link key={index} to={`/profile/${username}`}>
          <span>
            {part}
            <span className='mention-highlight text-sky-500 hover:underline hover:text-sky-700'>
              {match}
            </span>
          </span>
        </Link>
      );
    }
    return part;
  });
};

export default userHighlightMentions;
