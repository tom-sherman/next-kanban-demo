"use client";

import { Icon } from "@/app/_components/icons";
import { Board } from "@/app/_lib/db";
import Link from "next/link";
import { startTransition, useOptimistic } from "react";

interface BoardsProps {
  boards: Board[];
  removeBoardAction: (data: FormData) => Promise<void>;
}

export function Boards({ boards, removeBoardAction }: BoardsProps) {
  const [optimisticBoards, removeBoard] = useOptimistic(boards, (boards, id) =>
    boards.filter((b) => b.id !== id)
  );

  return (
    <div className="p-8">
      <h2 className="font-bold mb-2 text-xl">Boards</h2>
      <nav className="flex flex-wrap gap-8">
        {optimisticBoards.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            className="w-60 h-40 p-4 block border-b-8 shadow rounded hover:shadow-lg bg-white relative"
            style={{ borderColor: board.color }}
          >
            <div className="font-bold">{board.name}</div>
            <form
              action={removeBoardAction}
              onSubmit={(e) => {
                e.preventDefault();
                // @ts-expect-error Async actions aren't supported but i'm pretty sure that's what we want here
                startTransition(() => {
                  removeBoard(board.id);
                  return removeBoardAction(new FormData(e.currentTarget));
                });
              }}
            >
              <input type="hidden" name="id" value={board.id} />
              <button
                aria-label="Delete board"
                className="absolute top-4 right-4 hover:text-brand-red"
                type="submit"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Icon name="trash" />
              </button>
            </form>
          </Link>
        ))}
      </nav>
    </div>
  );
}
