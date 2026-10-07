"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fmtTime, saleCode } from "@/lib/format";

type Item = { productId?: string; name: string; qty: number; price: number };
type Pay = { method: string; amount: number };
type Result = { error: string } | { ok: true; code: string; time: string };

const METHODS = ["dinheiro", "débito", "crédito", "pix", "fiado", "outros"];

/**
 * Cria a venda inteira (venda + itens + pagamentos + baixa de estoque) em uma
 * única transação no banco, via RPC create_sale. Se qualquer etapa falhar,
 * nada é gravado — antes eram 4 chamadas separadas e podiam ficar inconsistentes.
 */
export async function createSale(input: {
  items: Item[];
  payments: Pay[];
  customer?: string;
  note?: string;
}): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  // ---- validação defensiva no servidor (nunca confie só no cliente) --------
  const items = (input.items ?? []).map((i) => ({
    productId: i.productId || null,
    qty: Math.max(1, Math.floor(Number(i.qty) || 1)),
    price: Number(i.price) || 0,
  }));
  if (items.length === 0) return { error: "Carrinho vazio." };

  const payments = (input.payments ?? []).map((p) => ({
    method: METHODS.includes(p.method) ? p.method : "outros",
    amount: Math.round((Number(p.amount) || 0) * 100) / 100,
  }));
  if (payments.length === 0) return { error: "Informe a forma de pagamento." };
  if (payments.some((p) => p.amount <= 0)) return { error: "Valor de pagamento inválido." };

  const customer = (input.customer ?? "").trim().slice(0, 80) || null;
  const note = (input.note ?? "").trim().slice(0, 300) || null;

  const { data, error } = await supabase.rpc("create_sale", {
    p_items: items,
    p_payments: payments,
    p_customer: customer,
    p_note: note,
  });

  if (error) {
    // mensagens de negócio vindas do banco são seguras de mostrar
    const known = [
      "carrinho vazio",
      "os pagamentos não fecham o total",
      "identifique o cliente para vender no fiado",
      "produto indisponível",
      "valor inválido",
      "loja inativa",
    ];
    const msg = known.find((k) => error.message.includes(k));
    return { error: msg ? msg.charAt(0).toUpperCase() + msg.slice(1) + "." : "Não foi possível salvar a venda." };
  }

  const sale = data as { number: number; created_at: string } | null;
  if (!sale) return { error: "Não foi possível salvar a venda." };

  revalidatePath("/");
  revalidatePath("/vendas");
  revalidatePath("/estoque");
  return { ok: true, code: saleCode(sale.number), time: fmtTime(sale.created_at) };
}
