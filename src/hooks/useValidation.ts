import { useState, useCallback } from "react";
import type { ValidationResult } from "@/lib/validations";

/** Tipo do validador: recebe valor e retorna mensagem de erro ou undefined */
export type FieldValidator<T = string> = (value: T) => ValidationResult;

export interface UseValidationOptions {
  /** Se true, valida no primeiro blur e depois a cada mudança. Se false, só valida em blur e submit. */
  validateOnChangeAfterTouch?: boolean;
}

/**
 * Hook para validação em tempo real em formulários controlados.
 * - Chame touch(name) no onBlur do campo.
 * - Chame validate(name, value, validator) no onBlur e, opcionalmente, no onChange (se já touched).
 * - Use validateAll para checar tudo antes do submit.
 * - errors[name] contém a mensagem de erro a exibir abaixo do campo.
 */
export function useValidation(options: UseValidationOptions = {}) {
  const { validateOnChangeAfterTouch = true } = options;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = useCallback((name: string) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  const validate = useCallback(
    <T>(name: string, value: T, validator: FieldValidator<T>): ValidationResult => {
      const result = validator(value);
      setErrors((prev) => {
        if (result === undefined) {
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return { ...prev, [name]: result };
      });
      return result;
    },
    []
  ) as <T>(name: string, value: T, validator: FieldValidator<T>) => ValidationResult;

  /**
   * Para usar no onBlur: marca o campo como touched e valida.
   */
  const handleBlur = useCallback(
    <T>(name: string, value: T, validator: FieldValidator<T>) => {
      touch(name);
      validate(name, value, validator);
    },
    [touch, validate]
  );

  /**
   * Para usar no onChange (após atualizar o state): valida em tempo real a cada digitação.
   * Erro só é exibido se: campo já foi tocado (blur) OU campo tem conteúdo (para não mostrar "obrigatório" antes de interagir).
   */
  const handleChange = useCallback(
    <T>(name: string, value: T, validator: FieldValidator<T>) => {
      const result = validator(value);
      const valueStr = typeof value === "string" ? (value as string).trim() : String(value ?? "");
      const showError = result !== undefined && (touched[name] || valueStr.length > 0);
      setErrors((prev) => {
        if (!showError) {
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return { ...prev, [name]: result! };
      });
    },
    [touched]
  );

  /**
   * Valida todos os campos e retorna true se todos estiverem válidos.
   * entries: [nome, valor, validador][] — valor e validador podem ser string ou number por entrada.
   */
  const validateAll = useCallback(
    (entries: Array<[string, unknown, (value: unknown) => ValidationResult]>): boolean => {
      let allValid = true;
      const newErrors: Record<string, string> = {};
      for (const [name, value, validator] of entries) {
        const result = validator(value);
        if (result !== undefined) {
          newErrors[name] = result;
          allValid = false;
        }
      }
      setErrors(newErrors);
      setTouched((prev) => {
        const next = { ...prev };
        entries.forEach(([name]) => {
          next[name] = true;
        });
        return next;
      });
      return allValid;
    },
    []
  );

  const getError = useCallback((name: string) => errors[name], [errors]);

  const getTouched = useCallback((name: string) => touched[name], [touched]);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    getError,
    getTouched,
    touch,
    validate,
    handleBlur,
    handleChange,
    validateAll,
    clearError,
    clearAll,
  };
}
