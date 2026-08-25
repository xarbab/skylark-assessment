import type { MondayRecord } from "@/types/bi";

const MONDAY_ENDPOINT = "https://api.monday.com/v2";

type RawItem = {
  id: string; name: string; group: { title: string };
  column_values: { id: string; text: string; value: string | null; column: { title: string; type: string } }[];
};

async function request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("MONDAY_API_TOKEN is not configured.");
  const response = await fetch(MONDAY_ENDPOINT, {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2025-04" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = await response.json() as { data?: T; errors?: { message: string }[] };
  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(body.errors?.map((e) => e.message).join("; ") || `Monday API failed (${response.status}).`);
  }
  return body.data;
}

function convert(items: RawItem[]): MondayRecord[] {
  return items.map((item) => ({
    id: item.id, name: item.name, group: item.group?.title ?? "Ungrouped",
    cells: item.column_values.map((c) => ({ id: c.id, title: c.column.title, type: c.column.type, text: c.text ?? "", value: c.value })),
  }));
}

export async function readBoard(boardId: string): Promise<{ name: string; records: MondayRecord[] }> {
  const first = await request<{ boards: { name: string; items_page: { cursor: string | null; items: RawItem[] } }[] }>(`
    query BoardItems($ids: [ID!]!) {
      boards(ids: $ids) { name items_page(limit: 500) { cursor items { id name group { title } column_values { id text value column { title type } } } } }
    }`, { ids: [boardId] });
  const board = first.boards[0];
  if (!board) throw new Error(`Monday board ${boardId} was not found or is not accessible.`);
  const records = [...board.items_page.items];
  let cursor = board.items_page.cursor;
  while (cursor) {
    const next = await request<{ next_items_page: { cursor: string | null; items: RawItem[] } }>(`
      query NextItems($cursor: String!) { next_items_page(limit: 500, cursor: $cursor) { cursor items { id name group { title } column_values { id text value column { title type } } } } }
    `, { cursor });
    records.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }
  return { name: board.name, records: convert(records) };
}

export async function readBusinessBoards() {
  const dealsId = process.env.MONDAY_DEALS_BOARD_ID;
  const workOrdersId = process.env.MONDAY_WORK_ORDERS_BOARD_ID;
  if (!dealsId || !workOrdersId) throw new Error("Both Monday board IDs must be configured.");
  const [deals, workOrders] = await Promise.all([readBoard(dealsId), readBoard(workOrdersId)]);
  return { deals, workOrders };
}

export function configurationState() {
  return {
    mondayToken: Boolean(process.env.MONDAY_API_TOKEN), dealsBoard: Boolean(process.env.MONDAY_DEALS_BOARD_ID),
    workOrdersBoard: Boolean(process.env.MONDAY_WORK_ORDERS_BOARD_ID), hfToken: Boolean(process.env.HF_TOKEN),
  };
}
