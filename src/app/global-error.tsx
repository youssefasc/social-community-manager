"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-svh items-center justify-center p-4 font-sans">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Application error</h1>
          <p className="mt-2 text-sm text-gray-500">{error.message}</p>
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
