import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Mensagem de erro (alias: error para compatibilidade) */
  message?: string | null;
  error?: string | null;
}

/** Exibe mensagem de validação abaixo do campo. Não renderiza nada se a mensagem for vazia. */
export function FieldError({ message, error, className, ...props }: FieldErrorProps) {
  const msg = error ?? message;
  if (!msg?.trim()) return null;
  return (
    <p
      role="alert"
      className={cn("text-sm text-destructive mt-1", className)}
      {...props}
    >
      {msg}
    </p>
  );
}
