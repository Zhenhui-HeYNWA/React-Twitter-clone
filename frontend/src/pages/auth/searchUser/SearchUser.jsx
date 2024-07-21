import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';

import { FaSearch } from 'react-icons/fa';

const searchUsers = async (query) => {
  const res = await fetch(`/api/users/search?q=${query}`);
  if (!res.ok) {
    throw new Error('Error fetching search results');
  }
  return res.json();
};

const SearchUser = () => {
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
    <div className='search-user-container '>
      <button
        className=''
        onClick={() => document.getElementById('my_modal_5').showModal()}>
        <FaSearch />
      </button>
      <dialog id='my_modal_5' className='modal modal-middle sm:modal-middle '>
        <div className='modal-box bg-gray-200 dark:bg-secondary'>
          <h3 className='font-bold text-lg'>Hello!</h3>

          <form className='search-form'>
            <input
              type='text'
              placeholder='Search users...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='search-input bg-gray-200 dark:bg-secondary'
            />
          </form>
          <div className='search-results bg-gray-200 dark:bg-secondary'>
            {isFetching ? (
              <div>Loading...</div>
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user.username}`}
                  className='search-result-item'>
                  <div>{user.fullName}</div>
                </Link>
              ))
            ) : (
              <div>No users found</div>
            )}
          </div>
          <div className='modal-action'>
            <form method='dialog'>
              {/* if there is a button in form, it will close the modal */}
              <button className='btn bg-gray-200 dark:bg-secondary'>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default SearchUser;
