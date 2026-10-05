const Spinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-gray-700 border-t-indigo-500 animate-spin`}
    />
  );
};

export default Spinner;
