import { MdNightlight, MdSunny } from 'react-icons/md';
import { useTheme } from './ThemeProvider';

const ThemeToggler = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <button
        className='outline-none border-none bg-transparent'
        onClick={toggleTheme}>
        {theme === 'light' ? (
          <MdSunny className='w-6 h-6 text-secondary dark:text-white' />
        ) : (
          <MdNightlight className='w-6 h-6 text-secondary dark:text-white' />
        )}
      </button>
    </div>
  );
};

export default ThemeToggler;
