import { getCurrentUserId } from "@/app/_lib/auth";
import {
  Item,
  ItemMutation,
  createColumn,
  getBoard,
  updateBoardName,
  updateColumnName,
  upsertItem,
} from "@/app/_lib/db";
import { notFound, redirect } from "next/navigation";
import { BoardWrapper } from "./_components/board-wrapper";
import { EditableText } from "./_components/editable-text";
import invariant from "tiny-invariant";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { Columns } from "./_components/column";
import { BoardTitle } from "./_components/board-title";

export default async function Board({ params }: { params: { id: string } }) {
  noStore();
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const id = Number(params.id);

  const board = await getBoard(id, userId);
  if (!board) notFound();
  const boardPath = `/board/${board.id}`;

  async function updateBoardNameAction(formData: FormData) {
    "use server";
    let name = String(formData.get("name") || "");
    invariant(name, "Missing name");
    await updateBoardName(board!.id, name, userId!);
    revalidatePath(boardPath);
    revalidatePath("/home");
  }

  async function moveItemAction(item: ItemMutation) {
    "use server";
    await upsertItem(item, userId!, board!.id);
    revalidatePath(boardPath);
  }

  async function renameColumnAction(formData: FormData) {
    "use server";
    const name = formData.get("name");
    invariant(name, "Missing name");
    updateColumnName(String(formData.get("id") ?? ""), String(name), userId!);
    revalidatePath(boardPath);
  }

  async function newColumnAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "");
    invariant(name, "Missing name");

    await createColumn(board!.id, name, userId!);
    revalidatePath(boardPath);
  }

  let itemsByColumnId = getItemsByColumnId(board.items);
  const columns = board.columns.map((col) => {
    return {
      ...col,
      items: itemsByColumnId.get(col.id) ?? [],
    };
  });

  return (
    <BoardWrapper boardColor={board.color}>
      <h1>
        <BoardTitle
          boardName={board.name}
          updateBoardNameAction={updateBoardNameAction}
        />
      </h1>

      <div className="flex flex-grow min-h-0 h-full items-start gap-4 px-8 pb-4">
        <Columns
          columns={columns}
          moveItemAction={moveItemAction}
          renameColumnAction={renameColumnAction}
          newColumnAction={newColumnAction}
          boardId={board.id}
        />

        {/* trolling you to add some extra margin to the right of the container with a whole dang div */}
        <div data-lol className="w-8 h-1 flex-shrink-0" />
      </div>
    </BoardWrapper>
  );
}

function getItemsByColumnId(items: Item[]) {
  const map = new Map<string, Item[]>();

  for (const item of items) {
    let columnItems = map.get(item.columnId);
    if (!columnItems) {
      columnItems = [];
      map.set(item.columnId, columnItems);
    }
    columnItems.push(item);
  }

  return map;
}
