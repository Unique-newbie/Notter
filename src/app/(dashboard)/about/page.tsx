'use client';

import React, { useState } from 'react';
import { Code2, HardDrive, Terminal, ShieldCheck, CheckCircle2,  } from 'lucide-react';

export default function AboutPage() {
  const [devMode, setDevMode] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 select-none">
      
      {/* App Header Banner */}
      <div className="About-Section-Header align-middle flex flex-col items-center justify-center space-y-2 font-size-lg text-[#a1a1aa]">
        <h1 className="text-lg text-[#a1a1aa]">
          To be built.
        </h1>
      </div>
    </div>
  );
}
