import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const RenderCombinedText = ({ text }) => {
  const [mentionedUsersExistence, setMentionedUsersExistence] = useState({});
  const navigate = useNavigate();

  // 确保传入的文本有效，如果没有则用空字符串代替
  const validText = text || '';

  // Memoized function to check mentioned users' existence
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
  }, []);

  useEffect(() => {
    const mentionedUsernames = [];

    // 检查文本中的提及
    if (validText) {
      mentionedUsernames.push(...(validText.match(/@\w+/g) || []));
    }

    // 去除 @ 符号
    const usernamesWithoutAt = mentionedUsernames.map((m) => m.substring(1));

    // 如果有提及的用户名，检查用户是否存在
    if (usernamesWithoutAt.length > 0) {
      fetchMentionedExistence(usernamesWithoutAt).then((data) => {
        setMentionedUsersExistence(data);
      });
    }
  }, [validText, fetchMentionedExistence]);

  // Regex patterns for URLs and quote status links
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
  const quoteLinkRegex = /(\/[a-zA-Z0-9_]+\/status\/[a-zA-Z0-9]+)/;
  const mentionRegex = /@\w+/g;

  // 处理点击事件
  const handleClick = (e, path) => {
    e.stopPropagation();
    navigate(path);
  };

  const processText = () => {
    // 使用 .match() 提取所有的链接和提及
    const matches = validText.match(
      new RegExp(
        `(${urlRegex.source}|${quoteLinkRegex.source}|${mentionRegex.source})`,
        'g'
      )
    );

    if (!matches) {
      // 如果没有匹配到任何链接或提及，直接返回原始文本
      return <span>{validText}</span>;
    }

    let lastIndex = 0;
    const elements = [];

    matches.forEach((match) => {
      const matchIndex = validText.indexOf(match, lastIndex);

      // 插入匹配项之前的普通文本
      if (matchIndex > lastIndex) {
        elements.push(
          <span key={uuidv4()}>{validText.slice(lastIndex, matchIndex)}</span>
        );
      }

      // 处理 URL
      if (urlRegex.test(match)) {
        elements.push(
          <a
            key={uuidv4()}
            href={match}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 hover:underline'>
            {match}
          </a>
        );
      }
      // 处理 Quote 链接
      else if (quoteLinkRegex.test(match)) {
        elements.push(
          <Link
            key={uuidv4()}
            to={match}
            className='text-blue-500 hover:underline'>
            {match}
          </Link>
        );
      }
      // 处理提及 @username
      else if (mentionRegex.test(match)) {
        const mentionedUsername = match.substring(1); // 去掉 @ 符号

        if (mentionedUsersExistence[mentionedUsername]) {
          elements.push(
            <span
              key={uuidv4()}
              className='mentioned-highlight text-sky-500 hover:underline hover:text-sky-700 cursor-pointer'
              onClick={(e) => handleClick(e, `/profile/${mentionedUsername}`)}>
              {match}
            </span>
          );
        } else {
          elements.push(<span key={uuidv4()}>{match}</span>);
        }
      }

      lastIndex = matchIndex + match.length;
    });

    // 添加最后剩余的文本
    if (lastIndex < validText.length) {
      elements.push(<span key={uuidv4()}>{validText.slice(lastIndex)}</span>);
    }

    return elements;
  };

  return <div className='text-base'>{processText()}</div>;
};

export default RenderCombinedText;
