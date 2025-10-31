import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

