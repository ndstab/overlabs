/**
 * Shown while the email is being generated.
 */
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-gray-700">Generating your email...</p>
        <p className="text-xs text-gray-400">
          Fetching papers, finding overlaps, writing the email. Usually takes 10–20 seconds.
        </p>
      </div>
    </div>
  );
}
