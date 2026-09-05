/**
 * Distingue o site (navegador) do aplicativo instalado.
 * - Site: a sessão dura apenas enquanto o navegador está aberto.
 * - Aplicativo instalado: a sessão fica guardada até tocar em "Sair".
 */
export function isAppInstalado() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const CHAVE_TAB = "cq_sessao_navegador";

/** Marca que esta janela do navegador já tem sessão ativa. */
export function marcarSessaoNavegador() {
  try {
    sessionStorage.setItem(CHAVE_TAB, "1");
  } catch {
    /* ignora */
  }
}

export function limparSessaoNavegador() {
  try {
    sessionStorage.removeItem(CHAVE_TAB);
  } catch {
    /* ignora */
  }
}

/** No site, uma sessão antiga de um navegador já fechado não deve valer. */
export function sessaoNavegadorValida() {
  try {
    return sessionStorage.getItem(CHAVE_TAB) === "1";
  } catch {
    return true;
  }
}

const CHAVE_ADMIN = "cq_admin_app";

export function guardarAdminApp(codigo: string) {
  try {
    (isAppInstalado() ? localStorage : sessionStorage).setItem(CHAVE_ADMIN, codigo);
  } catch {
    /* ignora */
  }
}

export function lerAdminApp() {
  try {
    return localStorage.getItem(CHAVE_ADMIN) ?? sessionStorage.getItem(CHAVE_ADMIN);
  } catch {
    return null;
  }
}

export function limparAdminApp() {
  try {
    localStorage.removeItem(CHAVE_ADMIN);
    sessionStorage.removeItem(CHAVE_ADMIN);
  } catch {
    /* ignora */
  }
}
