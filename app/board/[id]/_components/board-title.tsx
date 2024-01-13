"use client";

import { useOptimistic } from "react";
import { EditableText } from "./editable-text";

type BoardTitleProps = {
  boardName: string;
  updateBoardNameAction: (data: FormData) => Promise<void>;
};

export function BoardTitle({
  boardName,
  updateBoardNameAction,
}: BoardTitleProps) {
  const [optimisticName, setOptimisticName] = useOptimistic(boardName);

  return (
    <EditableText
      value={optimisticName}
      fieldName="name"
      inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
      buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
      buttonLabel={`Edit board "${optimisticName}" name`}
      inputLabel="Edit board name"
      action={async (formData) => {
        setOptimisticName(String(formData.get("name") ?? ""));
        await updateBoardNameAction(formData);
      }}
    />
  );
}
