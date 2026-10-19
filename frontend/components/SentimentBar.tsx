import React from 'react';

interface SentimentBarProps {
  sentiment: number; // -1 to 1
}

export const SentimentBar: React.FC<SentimentBarProps> = ({ sentiment }) => {
  // Normalize -1 to 1 into 0 to 100 for width
  const percentage = ((sentiment + 1) / 2) * 100;

  // Determine color based on sentiment value
  let colorClass = 'bg-gray-400 dark:bg-gray-500'; // Default neutral
  if (sentiment <= -0.6) colorClass = 'bg-red-600 dark:bg-red-500';
  else if (sentiment <= -0.2) colorClass = 'bg-red-400 dark:bg-red-400';
  else if (sentiment < 0.2) colorClass = 'bg-yellow-400 dark:bg-yellow-500';
  else if (sentiment < 0.6) colorClass = 'bg-green-400 dark:bg-green-400';
  else colorClass = 'bg-green-600 dark:bg-green-500';

  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 text-right">
        {sentiment.toFixed(1)}
      </span>
      <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative transition-colors">
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 dark:bg-slate-500 z-10"></div>
        
        {/* The bar itself */}
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
