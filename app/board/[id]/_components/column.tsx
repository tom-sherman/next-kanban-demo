"use client";

import { Column, Item, ItemMutation } from "@/app/_lib/db";
import clsx from "clsx";
import {
  useContext,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import invariant from "tiny-invariant";
import { EditableText } from "./editable-text";
import { BoardContainerRefContext } from "./board-wrapper";
import { CancelButton, SaveButton } from "./buttons";
import { flushSync } from "react-dom";
import { Icon } from "@/app/_components/icons";

const CONTENT_TYPES = {
  card: "application/next-card",
  column: "application/next-column",
};

type ColumnWithItems = Column & {
  items: Item[];
};

type ColumnsProps = {
  moveItemAction: (item: ItemMutation) => Promise<void>;
  renameColumnAction: (data: FormData) => Promise<void>;
  columns: ColumnWithItems[];
  newColumnAction: (data: FormData) => Promise<void>;
  boardId: number;
};

export function Columns({
  columns,
  moveItemAction,
  renameColumnAction,
  newColumnAction,
  boardId,
}: ColumnsProps) {
  const [optimisticColumns, setOptimisticColumns] = useOptimistic(columns);
  const [, startTransition] = useTransition();
  return (
    <>
      {optimisticColumns.map((col) => (
        <Column
          key={col.id}
          name={col.name}
          id={col.id}
          items={col.items}
          onAddInitialItem={(item) => {
            startTransition(async () => {
              setOptimisticColumns(
                optimisticColumns.map((c) =>
                  c.id === col.id
                    ? {
                        ...c,
                        items: [
                          {
                            ...item,
                            id: Math.random().toString(),
                            content: "",
                            boardId,
                          },
                        ],
                      }
                    : c
                )
              );
              await moveItemAction(item);
            });
          }}
          renameColumnAction={async (formData) => {
            setOptimisticColumns(
              optimisticColumns.map((c) =>
                c.id === col.id
                  ? { ...c, name: String(formData.get("name")) }
                  : c
              )
            );
            await renameColumnAction(formData);
          }}
        />
      ))}

      <NewColumn
        editInitially={optimisticColumns.length === 0}
        onNewColumn={async (formData) => {
          await newColumnAction(formData);
        }}
      />
    </>
  );
}

type ColumnProps = {
  onAddInitialItem: (item: ItemMutation) => void;
  renameColumnAction: (data: FormData) => Promise<void>;
  name: string;
  id: string;
  items: Item[];
};

function Column({
  name,
  id,
  items,
  onAddInitialItem,
  renameColumnAction,
}: ColumnProps) {
  const [acceptDrop, setAcceptDrop] = useState(false);

  return (
    <div
      className={clsx(
        "flex-shrink-0 flex flex-col overflow-hidden max-h-full w-80 border-slate-400 rounded-xl shadow-sm shadow-slate-400 bg-slate-100",
        acceptDrop && `outline outline-2 outline-brand-red`
      )}
      onDragOver={(event) => {
        if (
          items.length === 0 &&
          event.dataTransfer.types.includes(CONTENT_TYPES.card)
        ) {
          event.preventDefault();
          setAcceptDrop(true);
        }
      }}
      onDragLeave={() => {
        setAcceptDrop(false);
      }}
      onDrop={(event) => {
        const transfer = JSON.parse(
          event.dataTransfer.getData(CONTENT_TYPES.card)
        );
        invariant(transfer.id, "missing transfer.id");
        invariant(transfer.title, "missing transfer.title");

        setAcceptDrop(false);

        const item = {
          ...transfer,
          order: 1,
          columnId: id,
        };

        onAddInitialItem(item);
      }}
    >
      <div className="p-2">
        <EditableText
          fieldName="name"
          value={name}
          inputLabel="Edit column name"
          buttonLabel={`Edit column "${name}" name`}
          inputClassName="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
          buttonClassName="block rounded-lg text-left w-full border border-transparent py-1 px-2 font-medium text-slate-600"
          action={renameColumnAction}
        >
          <input type="hidden" name="id" value={id} />
        </EditableText>
      </div>
    </div>
  );
}

type NewColumnProps = {
  editInitially: boolean;
  onNewColumn: (data: FormData) => Promise<void>;
};

export function NewColumn({ onNewColumn, editInitially }: NewColumnProps) {
  const [editing, setEditing] = useState(editInitially);
  const boardScrollerRef = useContext(BoardContainerRefContext);
  const inputRef = useRef<HTMLInputElement>(null);

  function scrollRight() {
    invariant(boardScrollerRef.current, "no scroll container");
    boardScrollerRef.current.scrollLeft = boardScrollerRef.current.scrollWidth;
  }

  return editing ? (
    <form
      className="p-2 flex-shrink-0 flex flex-col gap-5 overflow-hidden max-h-full w-80 border rounded-xl shadow bg-slate-100"
      action={async (formData) => {
        await onNewColumn(formData);
        scrollRight();
        invariant(inputRef.current, "missing input ref");
        inputRef.current.value = "";
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setEditing(false);
        }
      }}
    >
      <input
        autoFocus
        required
        ref={inputRef}
        type="text"
        name="name"
        className="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
      />
      <div className="flex justify-between">
        <SaveButton>Save Column</SaveButton>
        <CancelButton onClick={() => setEditing(false)}>Cancel</CancelButton>
      </div>
    </form>
  ) : (
    <button
      onClick={() => {
        flushSync(() => {
          setEditing(true);
        });
        scrollRight();
      }}
      aria-label="Add new column"
      className="flex-shrink-0 flex justify-center h-16 w-16 bg-black hover:bg-white bg-opacity-10 hover:bg-opacity-5 rounded-xl"
    >
      <Icon name="plus" size="xl" />
    </button>
  );
}
