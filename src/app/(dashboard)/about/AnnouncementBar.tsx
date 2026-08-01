export function AnnouncementBar() {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950 text-sm text-zinc-200">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-2 sm:flex-row">
        <p className="text-center sm:text-left">
          ⭐ Enjoying <span className="font-semibold">NotterPad</span>? Support
          the project or contribute!
        </p>

        <div className="flex items-center gap-4 border bg-gray-800 border-zinc-800 rounded-lg px-3 py-1">
          <a
            href="https://ko-fi.com/zeromoney"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-pink-400 transition hover:text-pink-300"
          >
            ❤️ Ko-fi
          </a>

          <a
            href="https://github.com/Unique-newbie/Notter.git"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-400 transition hover:text-blue-300"
          >
            ⭐ GitHub
          </a>
        </div>
      </div>
    </div>
  );
}