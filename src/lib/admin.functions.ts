import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function assertCodigo(codigo: string) {
  const esperado = process.env["ADMIN_CODE"];
  if (!esperado) throw new Error("Código de administrador não configurado");
  if (codigo !== esperado) throw new Error("Código inválido");
}

const comCodigo = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ codigo: z.string().min(1), ...shape });

export const entrarAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) => comCodigo({}).parse(input))
  .handler(async ({ data }) => {
    assertCodigo(data.codigo);
    return { ok: true };
  });

export const definirEstadoApp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    comCodigo({ ativo: z.boolean(), mensagem: z.string().max(400) }).parse(input),
  )
  .handler(async ({ data }) => {
    assertCodigo(data.codigo);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_status")
      .update({ ativo: data.ativo, mensagem: data.mensagem, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminUser = {
  id: string;
  email: string;
  nome: string;
  criadoEm: string;
  verificado: boolean;
  ultimoAcesso: string | null;
};

export const listarUtilizadores = createServerFn({ method: "POST" })
  .inputValidator((input) => comCodigo({}).parse(input))
  .handler(async ({ data: input }): Promise<AdminUser[]> => {
    assertCodigo(input.codigo);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      nome: (u.user_metadata?.["nome"] as string) ?? "",
      criadoEm: u.created_at,
      verificado: !!u.email_confirmed_at,
      ultimoAcesso: u.last_sign_in_at ?? null,
    }));
  });

export const confirmarUtilizador = createServerFn({ method: "POST" })
  .inputValidator((input) => comCodigo({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    assertCodigo(data.codigo);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const definirPalavraPasse = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    comCodigo({ userId: z.string().uuid(), password: z.string().min(6).max(72) }).parse(input),
  )
  .handler(async ({ data }) => {
    assertCodigo(data.codigo);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
