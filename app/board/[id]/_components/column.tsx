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
  newColumnAction: (data: FormData) => Promise<void>;
  createCardAction: (data: FormData) => Promise<void>;
  columns: ColumnWithItems[];
  boardId: number;
};

export function Columns({
  columns,
  moveItemAction,
  renameColumnAction,
  newColumnAction,
  createCardAction,
  boardId,
}: ColumnsProps) {
  const [optimisticColumns, setOptimisticColumns] = useOptimistic(columns);
  const [, startTransition] = useTransition();
  console.log(optimisticColumns[0]?.items.map((i) => i.order));

  function moveItem(newItem: ItemMutation) {
    startTransition(async () => {
      setOptimisticColumns((columns) => {
        const previousColumn = columns.find((c) => c.id === newItem.columnId);
        const newColumn = columns.find((c) => c.id === newItem.columnId);
        invariant(newColumn, "missing new column");
        invariant(previousColumn, "missing previous column");

        return columns.map((column) =>
          column.id === previousColumn?.id
            ? {
                ...column,
                items: column.items.map((item) =>
                  item.id === newItem.id
                    ? {
                        ...item,
                        ...newItem,
                        id: newItem.id ?? Math.random().toString(),
                      }
                    : item
                ),
              }
            : column
        );
      });
      await moveItemAction(newItem);
    });
  }

  return (
    <>
      {optimisticColumns.map((col) => (
        <Column
          key={col.id}
          name={col.name}
          id={col.id}
          items={col.items}
          // TODO: onMoveCard & onAddInitialItem & createCardAction could probably be a single prop
          onMoveCard={(item) => moveItem(item)}
          onAddInitialItem={(item) => moveItem(item)}
          createCardAction={async (formData) => {
            startTransition(async () => {
              setOptimisticColumns((cols) =>
                cols.map((c) =>
                  c.id === col.id
                    ? {
                        ...c,
                        items: [
                          ...c.items,
                          {
                            id: Math.random().toString(),
                            title: String(formData.get("title")),
                            order: (c.items.at(-1)?.order ?? 0) + 1,
                            content: null,
                            columnId: c.id,
                            boardId,
                          },
                        ],
                      }
                    : c
                )
              );
              await createCardAction(formData);
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
        newColumnAction={async (formData) => {
          startTransition(async () => {
            setOptimisticColumns((cols) => [
              ...cols,
              {
                id: Math.random().toString(),
                name: String(formData.get("name")),
                boardId,
                items: [],
                order: cols.length + 1,
              },
            ]);
            await newColumnAction(formData);
          });
        }}
      />
    </>
  );
}

type ColumnProps = {
  onAddInitialItem: (item: ItemMutation) => void;
  onMoveCard: (item: ItemMutation) => void;
  renameColumnAction: (data: FormData) => Promise<void>;
  name: string;
  id: string;
  items: Item[];
  createCardAction: (data: FormData) => Promise<void>;
};

function Column({
  name,
  id,
  items,
  onAddInitialItem,
  onMoveCard,
  renameColumnAction,
  createCardAction,
}: ColumnProps) {
  const [acceptDrop, setAcceptDrop] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  function scrollList() {
    invariant(listRef.current);
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }

  const sortedItems = items.slice().sort((a, b) => a.order - b.order);

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
      <ul ref={listRef} className="flex-grow overflow-auto">
        {sortedItems.map((item, index) => (
          <Card
            onMoveCard={onMoveCard}
            key={item.id}
            id={item.id}
            columnId={id}
            content={item.content}
            title={item.title}
            order={item.order}
            previousOrder={items[index - 1]?.order || 0}
            nextOrder={items[index + 1]?.order || item.order + 1}
          />
        ))}
      </ul>
      <NewCard
        onAddCard={scrollList}
        nextOrder={sortedItems.length === 0 ? 1 : sortedItems.at(-1)!.order + 1}
        columnId={id}
        createCardAction={createCardAction}
      />
    </div>
  );
}

type NewCardsProps = {
  columnId: string;
  nextOrder: number;
  onAddCard: () => void;
  createCardAction: (data: FormData) => Promise<void>;
};

function NewCard({
  onAddCard,
  createCardAction,
  nextOrder,
  columnId,
}: NewCardsProps) {
  const [edit, setEdit] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  return edit ? (
    <form
      className="px-2 py-1 border-t-2 border-b-2 border-transparent"
      action={async (formData) => {
        invariant(titleRef.current, "missing textarea ref");
        // TODO: Technically we're actually clearing too soon here
        titleRef.current.value = "";
        await createCardAction(formData);
      }}
    >
      <input type="hidden" name="columnId" value={columnId} />
      <input type="hidden" name="order" value={nextOrder} />
      <textarea
        ref={titleRef}
        autoFocus
        required
        name="title"
        placeholder="Enter a title for this card"
        className="outline-none shadow text-sm rounded-lg w-full py-1 px-2 resize-none placeholder:text-sm placeholder:text-slate-500 h-14"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          } else if (event.key === "Escape") {
            setEdit(false);
          }
        }}
        onChange={(event) => {
          let el = event.currentTarget;
          el.style.height = el.scrollHeight + "px";
        }}
      />
      <div className="flex justify-between">
        <SaveButton>Save Card</SaveButton>
        <CancelButton onClick={() => setEdit(false)}>Cancel</CancelButton>
      </div>
    </form>
  ) : (
    <div className="p-2">
      <button
        type="button"
        onClick={() => {
          flushSync(() => {
            setEdit(true);
          });
          onAddCard();
        }}
        className="flex items-center gap-2 rounded-lg text-left w-full p-2 font-medium text-slate-500 hover:bg-slate-200 focus:bg-slate-200"
      >
        <Icon name="plus" /> Add a card
      </button>
    </div>
  );
}

type NewColumnProps = {
  editInitially: boolean;
  newColumnAction: (data: FormData) => Promise<void>;
};

export function NewColumn({ newColumnAction, editInitially }: NewColumnProps) {
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
        await newColumnAction(formData);
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

type CardProps = {
  title: string;
  content: string | null;
  id: string;
  columnId: string;
  order: number;
  nextOrder: number;
  previousOrder: number;
  onMoveCard: (item: ItemMutation) => void;
};

function Card({
  title,
  content,
  previousOrder,
  nextOrder,
  order,
  columnId,
  id,
  onMoveCard,
}: CardProps) {
  const [acceptDrop, setAcceptDrop] = useState<"none" | "top" | "bottom">(
    "none"
  );
  return (
    <li
      className={clsx(
        "border-t-2 border-b-2 -mb-[2px] last:mb-0 cursor-grab active:cursor-grabbing px-2 py-1",
        {
          "border-t-brand-red border-b-transparent": acceptDrop === "top",
          "border-b-brand-red border-t-transparent": acceptDrop === "bottom",
          "border-t-transparent border-b-transparent": acceptDrop === "none",
        }
      )}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.card)) {
          event.preventDefault();
          event.stopPropagation();
          let rect = event.currentTarget.getBoundingClientRect();
          let midpoint = (rect.top + rect.bottom) / 2;
          setAcceptDrop(event.clientY <= midpoint ? "top" : "bottom");
        }
      }}
      onDragLeave={() => {
        setAcceptDrop("none");
      }}
      onDrop={(event) => {
        event.stopPropagation();

        let transfer = JSON.parse(
          event.dataTransfer.getData(CONTENT_TYPES.card)
        );
        invariant(transfer.id, "missing cardId");
        invariant(transfer.title, "missing title");

        let droppedOrder = acceptDrop === "top" ? previousOrder : nextOrder;
        let moveOrder = (droppedOrder + order) / 2;

        let mutation: ItemMutation = {
          order: moveOrder,
          columnId: columnId,
          id: transfer.id,
          title: transfer.title,
        };

        invariant(mutation.id, "missing mutation.id");
        invariant(mutation.title, "missing mutation.title");

        // TODO: Should this be in a transition?
        onMoveCard(mutation);
        setAcceptDrop("none");
      }}
    >
      <div
        draggable
        className="bg-white shadow shadow-slate-300 border-slate-300 text-sm rounded-lg w-full py-1 px-2 relative"
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            CONTENT_TYPES.card,
            JSON.stringify({ id, title })
          );
        }}
      >
        <h3>{title}</h3>
        <div className="mt-2">{content || <>&nbsp;</>}</div>
      </div>
    </li>
  );
}
