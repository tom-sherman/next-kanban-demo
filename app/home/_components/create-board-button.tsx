"use client";

import { Button } from "@/app/_components/button";
import { useFormStatus } from "react-dom";

export function CreateBoardButton() {
  const { pending } = useFormStatus();
  return <Button type="submit">{pending ? "Creating..." : "Create"}</Button>;
}
