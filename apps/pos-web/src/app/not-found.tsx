import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-4">
        <p className="text-6xl font-black text-slate-700">404</p>
        <h1 className="text-xl font-bold text-slate-300">Page not found</h1>
        <Link
          href="/"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to POS
        </Link>
      </div>
    </div>
  );
}
