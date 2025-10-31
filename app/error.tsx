'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center card max-w-md">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-gray-400 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="btn-primary mx-auto"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
