"use client";

import {
  ReactNode,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { flushSync } from "react-dom";

type EditableTextProps = {
  children?: ReactNode;
  fieldName: string;
  value: string;
  inputClassName: string;
  inputLabel: string;
  buttonClassName: string;
  buttonLabel: string;
  action: (data: FormData) => Promise<void>;
};

export function EditableText({
  children,
  fieldName,
  value,
  inputClassName,
  inputLabel,
  buttonClassName,
  buttonLabel,
  action,
}: EditableTextProps) {
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);

  function mutate(formData: FormData) {
    startTransition(async () => {
      setOptimisticValue(String(formData.get(fieldName)!));
      if (
        inputRef.current?.value !== optimisticValue &&
        inputRef.current?.value.trim() !== ""
      ) {
        await action(formData);
      }
    });
  }

  return edit ? (
    <form
      action={action}
      onSubmit={(event) => {
        mutate(new FormData(event.currentTarget));
        flushSync(() => {
          setEdit(false);
        });
        buttonRef.current?.focus();
      }}
    >
      {children}
      <input
        required
        ref={inputRef}
        type="text"
        aria-label={inputLabel}
        name={fieldName}
        defaultValue={optimisticValue}
        className={inputClassName}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            flushSync(() => {
              setEdit(false);
            });
            buttonRef.current?.focus();
          }
        }}
        onBlur={(event) => {
          setEdit(false);
          mutate(new FormData(event.currentTarget.form!));
        }}
      />
    </form>
  ) : (
    <button
      aria-label={buttonLabel}
      type="button"
      ref={buttonRef}
      onClick={() => {
        flushSync(() => {
          setEdit(true);
        });
        inputRef.current?.select();
      }}
      className={buttonClassName}
    >
      {optimisticValue || <span className="text-slate-400 italic">Edit</span>}
    </button>
  );
}
