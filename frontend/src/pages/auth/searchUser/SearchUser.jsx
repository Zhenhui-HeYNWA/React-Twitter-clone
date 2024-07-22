import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';

import { FaSearch, FaUser } from 'react-icons/fa';

const searchUsers = async (query) => {
  const res = await fetch(`/api/users/search?q=${query}`);
  if (!res.ok) {
    throw new Error('Error fetching search results');
  }
  return res.json();
};

const SearchUser = ({ authUser }) => {
  const [query, setQuery] = useState('');

  const {
    data: users,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchUsers(query),
    enabled: false, // Disable automatic query execution
  });

  // Use useMemo to debounce the refetch function
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        if (value.trim()) {
          refetch();
        }
      }, 500),
    [refetch]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  return (
    <div className='search-user-container'>
      <button
        className=''
        onClick={() => document.getElementById('my_modal_5').showModal()}>
        <FaSearch />
      </button>
      <dialog id='my_modal_5' className='modal modal-middle sm:modal-middle'>
        <div className='modal-box bg-gray-200 dark:bg-secondary pt-2'>
          <div className='flex items-center justify-between mb-6 gap-3'>
            <form className='search-form flex-grow'>
              <label className='input input-sm flex items-center gap-2 bg-inherit outline-none w-full border-none dark:bg-slate-800'>
                <input
                  type='text'
                  placeholder='Search users...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className='search-input rounded-lg bg-inherit dark:bg-slate-800 px-2  outline-none w-full'
                />
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 16 16'
                  fill='currentColor'
                  className='h-4 w-4 opacity-70'>
                  <path
                    fillRule='evenodd'
                    d='M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'
                    clipRule='evenodd'
                  />
                </svg>
              </label>
            </form>
            <div className='modal-action mt-0 items-center justify-center'>
              <form method='dialog'>
                <button className='bg-inherit border-none'>X</button>
              </form>
            </div>
          </div>
          <div className='search-results bg-gray-200 dark:bg-secondary overflow-y-auto max-h-64'>
            {isFetching ? (
              <div>Loading...</div>
            ) : users && users.length > 0 ? (
              users.map((user) => {
                const isFollowing = authUser?.followings.includes(user._id);

                return (
                  <Link
                    key={user._id}
                    to={`/profile/${user.username}`}
                    className='search-result-item flex flex-row mb-4 w-full'>
                    <div className='flex gap-2 items-center'>
                      <div className='avatar'>
                        <div className='w-8 rounded-full'>
                          <img
                            src={user.profileImg || '/avatar-placeholder.png'}
                            alt={`${user.username}'s profile`}
                          />
                        </div>
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-semibold tracking-tight truncate w-28'>
                          {user.fullName}
                        </span>
                        <span className='text-sm text-slate-500'>
                          @{user.username}
                        </span>
                        {isFollowing && (
                          <span className='text-xs flex gap-2  items-center text-slate-500'>
                            <FaUser size={10} />
                            Following
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div>No users found</div>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default SearchUser;
