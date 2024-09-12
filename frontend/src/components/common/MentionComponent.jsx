import { useRef } from 'react';
import { Mention } from 'primereact/mention';

const MentionComponent = (props) => {
  const { value, ...rest } = props; // Exclude autoResize from DOM elements
  // const mentionRef = useRef(null); // Ref for accessing Mention input

  // const textarea = document.querySelector('textarea');

  // textarea?.addEventListener('input', autoResize);

  // function autoResize() {
  //   this.style.height = 'auto'; // Reset height
  //   this.style.height = this.scrollHeight + 'px'; // Set height based on content
  // }

  return (
    <Mention
      // ref={mentionRef} // Attach ref to Mention
      value={value} // Pass the value
      {...rest} // Pass the remaining props
    />
  );
};

export default MentionComponent;
