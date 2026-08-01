import { KoFi, Github } from "@thesvg/react";
import { Star } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-2.5 text-sm sm:flex-row">

        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
            <Star className="h-4 w-4 fill-current" />
          </span>

          <p className="text-zinc-300">
            Enjoying{" "}
            <span className="font-bold text-white">NotterPad</span>?
            <span className="ml-1 text-zinc-400">
              Help support development or contribute on GitHub.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">

          <a
            href="https://ko-fi.com/zeromoney"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-2 font-semibold text-pink-300 transition-all hover:bg-pink-400/20 hover:text-white"
          >
            <KoFi className="h-4 w-4" />
            <span>Support</span>
          </a>

          <a
            href="https://github.com/Unique-newbie/Notter"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-semibold text-zinc-200 transition-all hover:border-[#7c3aed] hover:bg-[#7c3aed]/15 hover:text-white"
          >
            <Github className="h-4 w-4" variant="mono"/>
            <span>GitHub</span>
          </a>

        </div>
      </div>
    </div>
  );
}