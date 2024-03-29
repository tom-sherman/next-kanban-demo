"use client";

import { ReactNode, useRef, useState, useTransition } from "react";
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
  const [_pending, startTransition] = useTransition();
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return edit ? (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
        });
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
        defaultValue={value}
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
          startTransition(async () => {
            const newValue = inputRef.current!.value;
            if (newValue !== value && newValue.trim() !== "") {
              await action(new FormData(event.currentTarget.form!));
            }
          });
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
      {value || <span className="text-slate-400 italic">Edit</span>}
    </button>
  );
}
