import { useState } from 'react';
import { Mention } from 'primereact/mention';

const CustomMention = ({ placeholderText, value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);

  // Function to search for users based on the mention query
  const searchUsers = async (query) => {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error('Error fetching search results');
    }
    return res.json();
  };

  // Event triggered when searching for users
  const onSearch = async (event) => {
    const query = event.query.trim();

    if (query) {
      try {
        const users = await searchUsers(query);
        setSuggestions(users); // Update suggestions with fetched users
      } catch (error) {
        console.error('Failed to fetch search results:', error);
      }
    } else {
      setSuggestions([]); // Clear suggestions if query is empty
    }
  };

  // Template to display each user in the suggestion dropdown
  const CreatePostItemTemplate = (user) => (
    <div className='card rounded-none z-0 bg-gray-100 dark:bg-[#15202B] w-fit h-18 flex ring-1 ring-white'>
      <div className='card-body p-0'>
        <div className='flex gap-2 items-center hover:bg-slate-400 dark:hover:bg-cyan-900 p-2'>
          <div className='avatar'>
            <div className='w-8 rounded-full'>
              <img
                src={user.profileImg || '/avatar-placeholder.png'}
                alt={`${user.fullName}'s profile`}
              />
            </div>
          </div>
          <div className='flex flex-col'>
            <span className='font-semibold tracking-tight truncate w-28'>
              {user.fullName}
            </span>
            <span className='text-sm text-slate-500'>@{user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Mention
      value={value}
      onChange={onChange}
      suggestions={suggestions}
      onSearch={onSearch}
      field='username'
      placeholder={placeholderText}
      itemTemplate={CreatePostItemTemplate}
      className='word-wrap'
    />
  );
};

export default CustomMention;
