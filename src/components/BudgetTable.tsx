/**
 * Renders the trip budget from structured data the model emits in a
 * ```budget fenced block. The model only chooses quantities and unit prices;
 * all multiplication and totals are computed here, so arithmetic is always right.
 */
export interface BudgetItem {
  item: string;
  qty: number;
  unit: string;
  low: number;
  high: number;
}

export interface BudgetData {
  travellers: number;
  items: BudgetItem[];
  /** Extras/contingency as a share of the subtotal (default 0.1). */
  extras?: number;
}

export function parseBudget(json: string): BudgetData | null {
  try {
    const d = JSON.parse(json);
    const travellers = Math.max(1, Math.round(Number(d.travellers)));
    const items: BudgetItem[] = (Array.isArray(d.items) ? d.items : [])
      .map((x: Record<string, unknown>) => ({
        item: String(x.item ?? ''),
        qty: Number(x.qty),
        unit: String(x.unit ?? ''),
        low: Number(x.low),
        high: Number(x.high ?? x.low),
      }))
      .filter((x: BudgetItem) => x.item && [x.qty, x.low, x.high].every((n) => Number.isFinite(n) && n >= 0));
    if (!items.length || !Number.isFinite(travellers)) return null;
    const extras = Number.isFinite(Number(d.extras)) ? Math.min(Math.max(Number(d.extras), 0), 0.5) : 0.1;
    return { travellers, items, extras };
  } catch {
    return null;
  }
}

const eur = (n: number) => `€${(Math.round(n / 5) * 5).toLocaleString('en-US')}`;
const range = (a: number, b: number) => (Math.round(a / 5) === Math.round(b / 5) ? eur(a) : `${eur(a)}–${eur(b).slice(1)}`);
const unitPrice = (a: number, b: number) => (a === b ? `€${a}` : `€${a}–${b}`);

export default function BudgetTable({ data }: { data: BudgetData }) {
  const rows = data.items.map((i) => ({ ...i, totalLow: i.qty * i.low, totalHigh: i.qty * i.high }));
  const subLow = rows.reduce((s, r) => s + r.totalLow, 0);
  const subHigh = rows.reduce((s, r) => s + r.totalHigh, 0);
  const share = data.extras ?? 0.1;
  const exLow = subLow * share;
  const exHigh = subHigh * share;
  const totalLow = subLow + exLow;
  const totalHigh = subHigh + exHigh;
  const n = data.travellers;

  return (
    <div className="budget">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Basis</th>
            <th>Group</th>
            <th>Per person</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.item}</td>
              <td className="budget__basis">
                {r.qty} × {r.unit} × {unitPrice(r.low, r.high)}
              </td>
              <td>{range(r.totalLow, r.totalHigh)}</td>
              <td>{range(r.totalLow / n, r.totalHigh / n)}</td>
            </tr>
          ))}
          {share > 0 && (
            <tr>
              <td>Extras &amp; buffer</td>
              <td className="budget__basis">{Math.round(share * 100)}% of the above</td>
              <td>{range(exLow, exHigh)}</td>
              <td>{range(exLow / n, exHigh / n)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="budget__basis">
              {n} {n === 1 ? 'traveller' : 'travellers'}
            </td>
            <td>{range(totalLow, totalHigh)}</td>
            <td>{range(totalLow / n, totalHigh / n)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
