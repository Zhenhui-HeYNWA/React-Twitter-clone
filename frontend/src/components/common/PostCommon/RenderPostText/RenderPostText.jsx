import { useState, useEffect } from 'react';

const RenderPostText = ({ text }) => {
  const [checkRegex, setCheckRegex] = useState(false);

  useEffect(() => {
    const regex =
      /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.[a-zA-Z]{2,6})(\/[^\s]*)?$/;

    const isMatch = regex.test(text);
    setCheckRegex(isMatch);
  }, [text]); // Only run when the 'text' changes

  function checkText() {
    return checkRegex ? (
      <span className='text-blue-400 cursor-pointer underline'>{text}</span>
    ) : (
      <span>{text}</span>
    );
  }

  return <>{checkText()}</>;
};

export default RenderPostText;
