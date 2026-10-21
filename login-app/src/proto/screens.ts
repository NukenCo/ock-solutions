// Catálogo das telas do protótipo, com os IDs da documentação do fluxo.
// D10 e D11 (aprovação da recuperação assistida) ficam de fora: o procedimento ainda não existe.

export const SCREEN_GROUPS = [
  {
    title: 'A. Primeiro acesso e ativação',
    screens: {
      A01: 'Seu convite para a OCK (e-mail)',
      A02: 'Ative seu acesso',
      A03: 'Convite indisponível',
      A04: 'Solicitar novo convite',
      A05: 'Solicitação recebida',
      A06: 'Crie sua senha',
      A07: 'Revise sua senha',
      A08: 'Proteja sua conta',
      A09: 'Vincule o autenticador',
      A10: 'Escaneie o QR code',
      A11: 'Confirme o autenticador',
      A12: 'Código não confirmado',
      A13: 'Guarde seus códigos',
      A14: 'Códigos guardados',
      A15: 'Conta ativada',
    },
  },
  {
    title: 'B. Login recorrente',
    screens: {
      B01: 'Entre na OCK',
      B02: 'Confira seus dados',
      B03: 'Aguarde para tentar',
      B04: 'Confirme que é você',
      B05: 'Código inválido',
      B06: 'Conclua a proteção',
      B07: 'Acesso indisponível',
    },
  },
  {
    title: 'C. Recuperação de senha',
    screens: {
      C01: 'Recupere sua senha',
      C02: 'Confira seu e-mail',
      C03: 'Redefina sua senha (e-mail)',
      C04: 'Crie uma nova senha',
      C05: 'Link indisponível',
      C06: 'Senha atualizada',
      C07: 'Revise a nova senha',
    },
  },
  {
    title: 'D. Recuperação do autenticador',
    screens: {
      D01: 'Recupere o autenticador',
      D02: 'Use um código de recuperação',
      D03: 'Código não aceito',
      D04: 'Vincule um novo autenticador',
      D05: 'Solicite ajuda para recuperar',
      D06: 'Solicitação recebida',
      D07: 'Confirme o novo autenticador',
      D08: 'Guarde os novos códigos',
      D09: 'Autenticador atualizado',
    },
  },
  {
    title: 'E. Sessão e estados globais',
    screens: {
      E01: 'Início (fim do fluxo)',
      E02: 'Sair da sua conta?',
      E03: 'Você saiu da OCK',
      E04: 'Sua sessão expirou',
      E05: 'Não foi possível continuar',
      E06: 'Segurança da conta',
    },
  },
] as const;

type Keys<G> = G extends { screens: infer S } ? keyof S & string : never;
export type ScreenId = Keys<(typeof SCREEN_GROUPS)[number]>;

const ALL: readonly string[] = SCREEN_GROUPS.flatMap((group) => Object.keys(group.screens));

export function isScreenId(value: string): value is ScreenId {
  return ALL.includes(value);
}

export function screenName(id: ScreenId): string {
  for (const group of SCREEN_GROUPS) {
    const screens: Record<string, string> = group.screens;
    if (id in screens) return screens[id];
  }
  return id;
}
