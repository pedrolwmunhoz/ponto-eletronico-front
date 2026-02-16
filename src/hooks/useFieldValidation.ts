import { useState, useCallback } from "react";
import type { ValidationResult } from "@/lib/validations";

type Validator = (value: string) => ValidationResult;

export interface UseFieldValidationOptions {
  /** Valor inicial do campo */
  initialValue?: string;
  /** Validar ao montar (útil para formulários de edição) */
  validateOnMount?: boolean;
}

/**
 * Hook para validação em tempo real: ao digitar e ao sair do campo (blur).
 * - Erro de "obrigatório" só é exibido após o primeiro blur (evita mostrar antes do usuário interagir).
 * - Erros de formato são exibidos enquanto o usuário digita (assim que houver conteúdo).
 */
export function useFieldValidation(
  validator: Validator,
  options: UseFieldValidationOptions = {}
) {
  const { initialValue = "", validateOnMount = false } = options;
  const [value, setValueState] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  const runValidation = useCallback(
    (v: string): ValidationResult => validator(v),
    [validator]
  );

  const error = runValidation(value);

  /** Exibe erro de obrigatório só após blur; erros de formato após ter conteúdo */
  const showError = Boolean(
    error && (touched || (value.trim().length > 0))
  );
  const displayError = showError ? error : undefined;

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValueState(e.target.value);
    },
    []
  );

  const onBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const setValue = useCallback((v: string) => {
    setValueState(v);
  }, []);

  const reset = useCallback((newInitial = "") => {
    setValueState(newInitial);
    setTouched(false);
  }, []);

  return {
    value,
    setValue,
    onChange,
    onBlur,
    error: displayError,
    touched,
    setTouched,
    /** Para checagem antes de submit: erro real (não apenas o exibido) */
    validationError: error,
    reset,
  };
}
