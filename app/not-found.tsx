import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <FileQuestion className="w-24 h-24 text-gray-600 mx-auto mb-4" />
        <h2 className="text-4xl font-bold text-white mb-2">404</h2>
        <p className="text-gray-400 mb-6">Page not found</p>
        <Link href="/" className="btn-primary inline-block">
          Return Home
        </Link>
      </div>
    </div>
  );
}
