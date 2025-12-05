import React from "react";

const NotBacked = ({ className , style } :  { className?: string, style?: React.CSSProperties }) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`} style={style}>
      <div
        className="
          flex items-center space-x-2
          bg-neutral-200 text-neutral-800
          dark:bg-neutral-800 dark:text-neutral-200
          px-4 py-2 rounded-full shadow-lg text-sm font-semibold
          border border-neutral-200 dark:border-neutral-600
            backdrop-blur-lg
        "
      >
        <span className=" font-thin text-sm text-neutral-800 dark:text-neutral-200">NOT!</span>
        <span>Backed by</span>
        <span
          className="
            inline-flex items-center justify-center
            bg-orange-500 text-white rounded-md
            w-6 h-6 text-sm font-bold
          "
        >
         Y
        </span>
        <span>Combinator</span>
        <span role="img" aria-label="shrug emoji">
          🤷‍♂️
        </span>
      </div>
    </div>
  );
};

export default NotBacked;
