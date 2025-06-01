import React from 'react';

const NotBacked = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="
        flex items-center space-x-2
        bg-gray-800 text-gray-200
        dark:bg-gray-700 dark:text-gray-100
        px-4 py-2 rounded-full shadow-lg
        border border-gray-700 dark:border-gray-600
        text-lg font-semibold
      ">
        <span className="font-extrabold text-gray-100 dark:text-white">NOT</span>
        <span>Backed by</span>
        <span className="
          inline-flex items-center justify-center
          bg-orange-500 text-white rounded-md
          w-6 h-6 text-sm font-bold
        ">
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