import { redirect } from "next/navigation";
import { getCurrentUserId } from "../_lib/auth";
import { createBoard, deleteBoard, getBoardsForUser } from "../_lib/db";
import { Boards } from "./_components/boards";
import { Label, LabeledInput } from "../_components/input";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { CreateBoardButton } from "./_components/create-board-button";

export default async function Home() {
  noStore();
  const id = await getCurrentUserId();
  if (!id) redirect("/login");

  async function createBoardAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "");
    const color = String(formData.get("color") || "");
    const board = await createBoard(id!, name, color);
    redirect(`/board/${board.id}`);
  }

  async function removeBoardAction(boardId: number) {
    "use server";
    await deleteBoard(boardId, id!);
    revalidatePath("/home");
  }

  const boards = await getBoardsForUser(id);

  return (
    <div className="h-full">
      <form action={createBoardAction} className="p-8 max-w-md">
        <div>
          <h2 className="font-bold mb-2 text-xl">New Board</h2>
          <LabeledInput label="Name" name="name" type="text" required />
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Label htmlFor="board-color">Color</Label>
            <input
              id="board-color"
              name="color"
              type="color"
              defaultValue="#cbd5e1"
              className="bg-transparent"
            />
          </div>
          <CreateBoardButton />
        </div>
      </form>
      <Boards boards={boards} removeBoardAction={removeBoardAction} />
    </div>
  );
}
