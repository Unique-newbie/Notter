'use client';

import React from 'react';
import {
  CheckCircle2,
  ArrowRight,
  HeartHandshake,
  Users,
} from 'lucide-react';
import { KoFi, Github } from '@thesvg/react';

export default function AboutPage() {
  return (
    <>
      {/* ========================================================= */}
      {/* OPEN SOURCE */}
      {/* ========================================================= */}

      <section className="mt-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            Open Source
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white">
            Built With The Community,
            <br />
            Not Behind Closed Doors.
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Notter is proudly open source because we believe the best creative tools
            are built in public.
            Writers, developers, designers and contributors from around the world can
            help shape the future of this project.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* GitHub */}
          <div className="group rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden">
            <div className="border-b border-zinc-800 p-8">
              <Github
                width={54}
                height={54}
                className="text-white transition duration-300 group-hover:scale-110"
              />

              <h3 className="mt-6 text-3xl font-bold text-white">
                Contribute
              </h3>

              <p className="mt-4 leading-8 text-zinc-400">
                Whether it&apos;s fixing bugs, improving documentation,
                adding features or simply sharing ideas,
                every contribution makes Notter better.
              </p>
            </div>

            <div className="space-y-4 p-8">
              {[
                'Open Issues',
                'Feature Requests',
                'Pull Requests',
                'Documentation',
                'Translations',
                'Community Discussions',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-400" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}

              <button className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3 font-medium text-black transition hover:scale-[1.03]">
                View GitHub
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Ko-fi */}
          <div className="group rounded-3xl border border-zinc-800 bg-gradient-to-br from-pink-950/20 to-zinc-950 overflow-hidden">
            <div className="border-b border-zinc-800 p-8">
              <KoFi
                width={54}
                height={54}
                className="text-pink-400 transition duration-300 group-hover:scale-110"
              />

              <h3 className="mt-6 text-3xl font-bold text-white">
                Support Development
              </h3>

              <p className="mt-4 leading-8 text-zinc-400">
                Notter will always remain free and open source.
                Supporting the project helps fund infrastructure,
                development and future updates.
              </p>
            </div>

            <div className="space-y-4 p-8">
              {[
                'Keep development active',
                'Support new features',
                'Improve infrastructure',
                'Motivate long-term development',
                'Help writers worldwide',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <HeartHandshake size={18} className="text-pink-400" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}

              <button className="mt-8 inline-flex items-center gap-3 rounded-xl bg-pink-500 px-6 py-3 font-medium text-white transition hover:bg-pink-400 hover:scale-[1.03]">
                Support On Ko-fi
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ROADMAP */}
      {/* ========================================================= */}

      <section className="mt-36">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
            Roadmap
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white">
            Building The Ultimate Story Bible
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            We&apos;re just getting started.
            Every release moves Notter closer to becoming the complete creative
            workspace for storytellers.
          </p>
        </div>

        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="absolute left-7 top-0 h-full w-px bg-zinc-800" />

          {[
            {
              title: 'Version 1.0',
              status: 'Current',
              color: 'bg-green-500',
              items: ['Projects', 'Characters', 'Locations', 'Notes', 'Story Bible'],
            },
            {
              title: 'Version 2.0',
              status: 'In Progress',
              color: 'bg-blue-500',
              items: [
                'Timeline Builder',
                'Relationship Graph',
                'Organizations',
                'Magic Systems',
                'Series Support',
              ],
            },
            {
              title: 'Future',
              status: 'Vision',
              color: 'bg-purple-500',
              items: [
                'AI Writing Assistant',
                'Interactive Maps',
                'Real-time Collaboration',
                'Writing Analytics',
                'Offline Mode',
              ],
            },
          ].map((phase) => (
            <div key={phase.title} className="relative mb-16 pl-20">
              <div className={`absolute left-0 h-14 w-14 rounded-full ${phase.color}`} />

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{phase.title}</h3>
                    <p className="text-zinc-500">{phase.status}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {phase.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4"
                    >
                      <CheckCircle2 size={18} className="text-green-400" />
                      <span className="text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* COMMUNITY */}
      {/* ========================================================= */}

      <section className="mt-36 rounded-[32px] border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-14">
        <Users className="text-indigo-400" size={42} />

        <h2 className="mt-8 text-4xl font-bold text-white">
          More Than Software.
          <br />
          A Community Of Storytellers.
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
          Great stories inspire people.
          Great communities inspire creators.
          Our goal isn&apos;t simply to build software—
          it&apos;s to create a place where writers can grow together,
          share ideas, improve their worlds and help shape Notter itself.
        </p>
      </section>

      {/* ========================================================= */}
      {/* FINAL CTA */}
      {/* ========================================================= */}

      <section className="mt-36 overflow-hidden rounded-[36px] border border-indigo-500/20 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-16 text-center">
        <h2 className="text-5xl font-bold text-white">
          Let&apos;s Build The Future
          <br />
          Of Storytelling.
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-indigo-100">
          Whether you&apos;re writing your very first novel,
          publishing a web novel,
          creating a tabletop campaign,
          or designing an entire fictional universe—
          Notter is being built for you.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-5">
          <button className="rounded-xl bg-white px-7 py-4 font-semibold text-black transition hover:scale-105">
            Get Started
          </button>

          <button className="rounded-xl border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
            View GitHub
          </button>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-indigo-100">
          <p className="text-lg">Built with ❤️ by writers, for writers.</p>
          <p className="mt-3 text-sm opacity-80">
            © {new Date().getFullYear()} Notter. Open Source Forever.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MEET THE CREATOR */}
      {/* ========================================================= */}

      <section className="mt-36">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center border-b border-zinc-800 p-10 lg:border-b-0 lg:border-r">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border border-zinc-700 bg-gradient-to-br from-indigo-500 to-violet-600 text-5xl font-bold text-white">
                N
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-white">The Creator</h3>
              <p className="mt-2 text-zinc-500">Indie Developer • Writer</p>
            </div>

            {/* Content */}
            <div className="p-10 lg:p-14">
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
                Why I Started Notter
              </span>

              <h2 className="mt-6 text-4xl font-bold text-white">
                I Was Building
                <br />
                Worlds...
                <br />
                Not Fighting Notes.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
                <p>
                  Like many writers, I found myself juggling dozens of documents,
                  spreadsheets, notes and folders just to keep a single story
                  organized.
                </p>

                <p>
                  Characters lived in one document.
                  Magic systems lived somewhere else.
                  Worldbuilding was buried inside random notes.
                  Timelines became impossible to manage.
                </p>

                <p>
                  After spending more time organizing my story than actually writing
                  it, I realized there had to be a better solution.
                </p>

                <p>So instead of waiting for someone else to build it...</p>

                <p className="font-semibold text-white">I decided to build Notter.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* VALUES */}
      {/* ========================================================= */}

      <section className="mt-36">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400">
            Core Values
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white">What Drives Notter</h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Writers First',
              description:
                "Every decision begins with one question: does this genuinely help writers tell better stories?",
            },
            {
              title: 'Open By Default',
              description:
                'Knowledge grows when shared. Open source allows everyone to learn, contribute and improve together.',
            },
            {
              title: 'Beautiful Simplicity',
              description:
                "Powerful software doesn't need to be overwhelming. The best tools feel invisible while you create.",
            },
            {
              title: 'Built For The Long Run',
              description:
                "We're not chasing trends. We're building something writers will still love years from now.",
            },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 transition hover:border-indigo-500/30"
            >
              <h3 className="text-xl font-semibold text-white">{value.title}</h3>
              <p className="mt-4 leading-7 text-zinc-400">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL MESSAGE */}
      {/* ========================================================= */}

      <section className="mt-36">
        <div className="rounded-[40px] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black px-10 py-24 text-center">
          <h2 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white md:text-6xl">
            Every Great Story
            <br />
            Begins With
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {' '}
              One Idea.
            </span>
          </h2>

          <p className="mx-auto mt-10 max-w-3xl text-xl leading-9 text-zinc-400">
            Our mission is simple.
            Build the best Story Bible in the world.
            One that helps writers spend less time searching through notes,
            and more time creating unforgettable worlds.
          </p>

          <div className="mt-16 flex flex-wrap justify-center gap-5">
            <button className="rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition hover:bg-indigo-500">
              Start Your First Story
            </button>

            <button className="rounded-xl border border-zinc-700 px-8 py-4 font-semibold text-zinc-200 transition hover:bg-zinc-900">
              ⭐ Star On GitHub
            </button>

            <button className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-8 py-4 font-semibold text-pink-300 transition hover:bg-pink-500/20">
              ☕ Support On Ko-fi
            </button>
          </div>

          <div className="mt-20 border-t border-zinc-800 pt-8">
            <p className="text-lg text-zinc-500">Made with ❤️ for storytellers everywhere.</p>
            <p className="mt-3 text-sm text-zinc-600">
              © {new Date().getFullYear()} Notter • Open Source • Community Driven
            </p>
          </div>
        </div>
      </section>
    </>
  );
}