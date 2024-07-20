import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { MdOutlineMail, MdPassword } from 'react-icons/md';

import XSvg from '../../../components/svgs/X';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const queryClient = useQueryClient();

  const {
    mutate: login,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ username, password }) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Something went wrong');
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success('Login successful');

      //refetch the authUser
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTestUserLogin = (userData) => {
    setFormData(userData);
    login(userData);
  };

  return (
    <div className=' max-w-screen-xl mx-auto flex h-screen'>
      <div className='flex-1 hidden lg:flex items-center  justify-center'>
        <XSvg className='lg:w-2/3 dark:fill-white' />
      </div>
      <div className='flex-1 flex flex-col justify-center items-center'>
        <form className=' flex gap-4 flex-col' onSubmit={handleSubmit}>
          <XSvg className='w-24 lg:hidden dark:fill-white' />
          <h1 className='text-4xl font-extrabold text-black dark:text-white'>
            {"Let's"} go.
          </h1>
          <label className='input input-bordered rounded flex items-center gap-2 bg-slate-50 dark:bg-secondary'>
            <MdOutlineMail size={20} />
            <input
              type='text'
              className='grow  '
              placeholder='username '
              name='username'
              onChange={handleInputChange}
              value={formData.username}
            />
          </label>

          <label className=' input input-bordered rounded flex items-center gap-2 bg-slate-50 dark:bg-secondary'>
            <MdPassword size={20} />
            <input
              type='password'
              className='grow '
              placeholder='Password'
              name='password'
              onChange={handleInputChange}
              value={formData.password}
            />
          </label>

          <button className='btn rounded-full btn-primary text-white'>
            {isPending ? 'Loading...' : 'Login'}
          </button>
          {isError && <p className='text-red-500'>{error.message} </p>}
        </form>

        <div className='flex flex-col gap-2 mt-4'>
          <p className='text-lg text-black dark:text-white'>
            {"Don't"} have an account?
          </p>
          <Link to='/signup'>
            <button className='btn rounded-full btn-primary text-white btn-outline w-full'>
              Sign up
            </button>
          </Link>
          <button
            className='btn rounded-full btn-primary text-white'
            onClick={() =>
              handleTestUserLogin({
                username: 'testuser123',
                password: '123456789',
              })
            }>
            TestUser123
          </button>
          <button
            className='btn rounded-full btn-primary text-white'
            onClick={() =>
              handleTestUserLogin({
                username: 'testuser456',
                password: '987654321',
              })
            }>
            TestUser456
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
