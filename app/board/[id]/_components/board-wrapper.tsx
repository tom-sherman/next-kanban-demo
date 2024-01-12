"use client";

import { ReactNode, useRef } from "react";

export function BoardWrapper({
  children,
  boardColor,
}: {
  children: ReactNode;
  boardColor: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-x-scroll"
      ref={scrollContainerRef}
      style={{ backgroundColor: boardColor }}
    >
      {children}
    </div>
  );
}
