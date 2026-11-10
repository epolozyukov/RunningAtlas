import { useState, type FormEvent } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { Marathon, Race } from '../types';
import { monthName } from '../utils/marathonHelpers';
import { normaliseTime } from '../utils/userRaces';
import { parseTime } from '../utils/raceHelpers';

export interface ResultInput {
  date: string;
  result: string;
  bib: string;
  notes: string;
}

interface Props {
  marathon: Marathon;
  /** Dates you already have a result on for this race (excluding the one being edited). */
  takenDates: string[];
  /** When set, the form edits this result instead of adding a new one. */
  initial?: Race;
  /** Current marathon PB time in seconds, to celebrate a new one (add mode). */
  currentPbSec?: number | null;
  onSave: (input: ResultInput) => Race;
  /** Add mode: open the saved race. */
  onView?: (raceId: string) => void;
  /** Edit mode. */
  onCancel?: () => void;
  onDelete?: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddResultForm({ marathon: m, takenDates, initial, currentPbSec = null, onSave, onView, onCancel, onDelete }: Props) {
  const editing = !!initial;
  const [date, setDate] = useState(initial?.date ?? '');
  const [time, setTime] = useState(initial?.result ?? '');
  const [bib, setBib] = useState(initial?.bib ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ race: Race; isPb: boolean } | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Pick the race date.');
    if (date > todayIso()) return setError('The date is in the future. Add results after the race.');
    const result = normaliseTime(time);
    if (!result) return setError('Enter the finish time as H:MM:SS, e.g. 3:42:10.');
    if (takenDates.includes(date)) return setError('You already have a result for this race on that date.');
    const race = onSave({ date, result, bib, notes });
    if (editing) return; // parent returns to the race view
    const secs = parseTime(result);
    setSaved({ race, isPb: secs !== null && (currentPbSec === null || secs < currentPbSec) });
  };

  if (saved) {
    return (
      <div className="add-result add-result--done">
        <span className="add-result__check" aria-hidden>
          <Check size={20} />
        </span>
        <h3>Result saved</h3>
        <p className="add-result__time">{saved.race.result}</p>
        {saved.isPb && <p className="add-result__pb">New marathon personal best!</p>}
        <p className="muted">{m.name} has been added to your globe, race history, timeline and stats.</p>
        {onView && (
          <button type="button" className="btn-journey" onClick={() => onView(saved.race.id)}>
            View in My races
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="add-result" onSubmit={submit} onChange={() => error && setError('')} noValidate>
      <p className="eyebrow">{editing ? 'Edit my result' : 'Add my result'}</p>
      <h3 className="panel-title">{m.name}</h3>
      <p className="muted add-result__lede">Usually held in {monthName(m.month)} · 42.195 km</p>

      <label className="field">
        <span>Race date</span>
        <input type="date" required max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label className="field">
        <span>Finish time (net)</span>
        <input
          inputMode="numeric"
          placeholder="3:42:10"
          value={time}
          onChange={(e) => setTime(e.target.value.replace(/[^\d:]/g, ''))}
          autoComplete="off"
        />
      </label>

      <label className="field">
        <span>
          Bib number <em>optional</em>
        </span>
        <input inputMode="numeric" placeholder="16533" value={bib} onChange={(e) => setBib(e.target.value)} autoComplete="off" />
      </label>

      <label className="field">
        <span>
          Notes <em>optional</em>
        </span>
        <textarea rows={2} placeholder="Weather, how it felt, splits…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error && <p className="add-result__error">{error}</p>}

      <div className="add-result__buttons">
        <button type="submit" className="btn-journey">
          {editing ? 'Save changes' : 'Save result'}
        </button>
        {editing && onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        {editing && onDelete && (
          <button
            type="button"
            className="add-result__delete"
            onClick={() => {
              if (window.confirm(`Delete your ${m.name} result (${initial!.result})? This can’t be undone.`)) onDelete();
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </div>
      {!editing && <p className="add-result__note">Saved in this browser. Use “Download races.json” in Race History to make it permanent.</p>}
    </form>
  );
}
