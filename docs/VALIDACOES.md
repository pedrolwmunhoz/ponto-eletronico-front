# Validações no frontend

Este documento descreve a estratégia de validação em tempo real e a sincronização com a API.

## Visão geral

- **`lib/validations.ts`**: Regras e regex espelhadas dos DTOs da API (Java). Usado para validar antes do envio e em tempo real.
- **`hooks/useValidation.ts`**: Hook que centraliza erros por campo, `handleBlur`, `handleChange` e `validateAll` para submit.
- **`components/ui/field-error.tsx`**: Componente que exibe a mensagem de erro abaixo do campo (`error` ou `message`).

## Comportamento em tempo real

1. **Ao sair do campo (onBlur)**: O campo é marcado como "tocado" e a validação é executada. Erros de "obrigatório" passam a ser exibidos a partir daqui.
2. **Ao digitar (onChange)**: A validação é executada a cada alteração. O erro só é **exibido** se o campo já foi tocado ou se já tem conteúdo (evita mostrar "obrigatório" antes da primeira interação).
3. **Antes do submit**: `validateAll(entries)` valida todos os campos da lista e retorna `true` só se todos estiverem válidos; caso contrário preenche os erros e retorna `false`.

## Uso em formulários

```tsx
import { useValidation } from "@/hooks/useValidation";
import { FieldError } from "@/components/ui/field-error";
import { validateEmail, validateSenha } from "@/lib/validations";

function MeuForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { getError, handleBlur, handleChange, validateAll } = useValidation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll([
      ["email", email, (v) => validateEmail(v, true)],
      ["senha", senha, (v) => validateSenha(v, true)],
    ])) return;
    // enviar...
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Label required>E-mail</Label>
        <Input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            handleChange("email", e.target.value, (v) => validateEmail(v, true));
          }}
          onBlur={() => handleBlur("email", email, (v) => validateEmail(v, true))}
          aria-invalid={!!getError("email")}
        />
        <FieldError error={getError("email")} />
      </div>
      {/* ... */}
    </form>
  );
}
```

## Regras por DTO (API)

| DTO / Tela | Campos | Regras (validators em `lib/validations.ts`) |
|------------|--------|---------------------------------------------|
| LoginRequest | valor, tipoCredencial, senha | validateRequired, validateSenha |
| RecuperarSenhaRequest | email | validateEmail |
| ValidarCodigoRequest | codigo | validateCodigoRecuperacao (6 dígitos) |
| ResetarSenhaRequest | token, senhaNova | validateSenha |
| EmpresaCreateRequest | username, email, senha, razaoSocial, cnpj, empresaEndereco, usuarioTelefone | validateUsername, validateEmail, validateSenha, validateRazaoSocial, validateCnpj, validadores de endereço e telefone |
| UsuarioPerfilAtualizarRequest | username | validateUsername |
| UsuarioEmailRequest | novoEmail | validateEmail |
| UsuarioTelefoneAdicionarRequest | codigoPais, ddd, numero | validateCodigoPais, validateDdd, validateNumeroTelefone |
| EmpresaEnderecoRequest | rua, numero, complemento, bairro, cidade, uf, cep | validateRua, validateNumeroEndereco, validateComplemento, validateBairro, validateCidade, validateUf, validateCep |
| EmpresaJornadaConfigRequest | cargas, tolerância, intervalo, timezone | validateDurationHhmm, validateTimezone |
| FuncionarioCreateRequest | username, nomeCompleto, primeiroNome, ultimoNome, cpf, email, senha, telefone, contrato, jornada | validadores homônimos em validations.ts |
| CriarFeriadoRequest / EditarFeriadoRequest | data, descricao, tipoFeriadoId | validateData, validateDescricaoFeriado |
| CriarGeofenceRequest | nome, descricao, latitude, longitude, raioMetros | validateNomeGeofence, validateDescricaoGeofence, validateLatitude, validateLongitude, validateRaioMetros |
| CriarAfastamentoRequest | tipoAfastamentoId, dataInicio | validateRequired, validateData |
| ReprovarSolicitacaoRequest | motivo | validateMotivo |
| RegistroPontoManualRequest / EmpresaCriarRegistroPontoRequest | horario, justificativa | validateData, validateHorario, validateJustificativa |

## Telas com validação aplicada

- **LoginPage**: valor, senha (tempo real + validateAll no submit).
- **CadastroEmpresaPage**: todos os passos (empresa, endereço, contato, acesso) com validateStep1/2/3 e validateAll no step 4.
- **RecuperarSenhaPage**: email, codigo, senhaNova (e confirmar senha no front).
- **ModalPerfil (empresa)**: username, email, telefone, endereço, jornada; validateAll antes de salvar.
- **ModalCriarRegistro**: data, time, justificativa; validateAll no submit.
- **SolicitacoesPage (reprovar)**: motivo; handleChange/handleBlur + validateAll no submit.

## Telas que podem usar o mesmo padrão

- **FeriadosPage** (criar/editar): data, descricao, tipoFeriadoId.
- **GeofencesPage** (criar): nome, descricao, latitude, longitude, raioMetros.
- **FeriasPage** (criar afastamento): funcionário, tipoAfastamentoId, dataInicio.
- **ConfigInicialPage**: jornada e banco de horas (validadores de duração, totalDiasVencimento).
- **FuncionariosPage** (criar/editar): dados pessoais, telefone, contrato, jornada (reutilizar validators de validations.ts + useValidation).

## Manutenção

- Ao alterar validações em um DTO na API (regex, @Size, @Min/@Max, etc.), atualizar `lib/validations.ts` e, se necessário, as mensagens nos formulários.
- Novos formulários: usar `useValidation` + `handleChange`/`handleBlur` em cada campo + `FieldError` + `validateAll` antes do submit.
