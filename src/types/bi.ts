export type MondayCell = {
  id: string;
  title: string;
  type: string;
  text: string;
  value: string | null;
};

export type MondayRecord = {
  id: string;
  name: string;
  group: string;
  cells: MondayCell[];
};

export type Deal = {
  id: string;
  name: string;
  owner: string | null;
  client: string | null;
  status: string;
  stage: string;
  probability: string | null;
  probabilityWeight: number;
  value: number | null;
  tentativeCloseDate: string | null;
  actualCloseDate: string | null;
  sector: string;
  product: string | null;
  createdDate: string | null;
  issues: string[];
};

export type WorkOrder = {
  id: string;
  name: string;
  serial: string | null;
  customer: string | null;
  owner: string | null;
  sector: string;
  nature: string | null;
  executionStatus: string;
  startDate: string | null;
  endDate: string | null;
  orderValue: number | null;
  billed: number | null;
  receivable: number | null;
  collected: number | null;
  invoiceStatus: string | null;
  issues: string[];
};

export type QueryPlan = {
  intent: "pipeline" | "revenue" | "operations" | "sector" | "leadership_update" | "overview";
  sector: string | null;
  owner: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  needsClarification: boolean;
  clarificationQuestion: string | null;
};

export type Metric = { label: string; value: string; detail?: string };
export type BIResult = {
  answer: string;
  metrics: Metric[];
  insights: string[];
  caveats: string[];
  sources: { board: string; rowsUsed: number; rowsAvailable: number }[];
  plan: QueryPlan;
  generatedAt: string;
};
