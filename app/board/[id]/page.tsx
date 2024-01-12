import { getCurrentUserId } from "@/app/_lib/auth";
import { getBoard, updateBoardName } from "@/app/_lib/db";
import { notFound, redirect } from "next/navigation";
import { BoardWrapper } from "./_components/board-wrapper";
import { EditableText } from "./_components/editable-text";
import invariant from "tiny-invariant";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";

export default async function Board({ params }: { params: { id: string } }) {
  noStore();
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const id = Number(params.id);

  const board = await getBoard(id, userId);
  if (!board) notFound();

  async function updateBoardNameAction(formData: FormData) {
    "use server";
    let name = String(formData.get("name") || "");
    invariant(name, "Missing name");
    await updateBoardName(board!.id, name, userId!);
    revalidatePath(`/board/${board!.id}`, "page");
    revalidatePath("/home", "page");
  }

  return (
    <BoardWrapper boardColor={board.color}>
      <h1>
        <EditableText
          value={board.name}
          fieldName="name"
          inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
          buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
          buttonLabel={`Edit board "${board.name}" name`}
          inputLabel="Edit board name"
          action={updateBoardNameAction}
        >
          <input type="hidden" name="id" value={board.id} />
        </EditableText>
      </h1>

      <div className="flex flex-grow min-h-0 h-full items-start gap-4 px-8 pb-4">
        {/* {[...columns.values()].map((col) => {
          return (
            <Column
              key={col.id}
              name={col.name}
              columnId={col.id}
              items={col.items}
            />
          );
        })}

        <NewColumn
          boardId={board.id}
          onAdd={scrollRight}
          editInitially={board.columns.length === 0}
        /> */}

        {/* trolling you to add some extra margin to the right of the container with a whole dang div */}
        <div data-lol className="w-8 h-1 flex-shrink-0" />
      </div>
    </BoardWrapper>
  );
}
