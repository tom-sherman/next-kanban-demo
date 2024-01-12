"use client";

import { ReactNode, RefObject, useRef, createContext } from "react";

export const BoardContainerRefContext = createContext<
  RefObject<HTMLDivElement>
>({
  current: null,
});

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
      <BoardContainerRefContext.Provider value={scrollContainerRef}>
        {children}
      </BoardContainerRefContext.Provider>
    </div>
  );
}
