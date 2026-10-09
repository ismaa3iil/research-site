export const PROTOCOL_VERSION = 'pilot-1.0';
export const families = { qalqala: 'Qalqala', ghunna_geminate: 'Ghunna · geminate', madd_wajib: 'Madd wajib', madd_lazim: 'Madd lazim' };
export const median = values => {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b), m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
export function summarize(data, clip) {
  const ms = interval => (interval.end - interval.start) * 1000 / clip.sampleRate;
  const refs = data.references.filter(r => r.eligible);
  const sv = refs.filter(r => r.kind === 'short_vowel').map(ms);
  const nat = refs.filter(r => r.kind === 'natural_madd').map(ms);
  const targetMs = data.applicability === 'yes' && data.target ? ms(data.target) : null;
  const hSv = sv.length >= 5 ? median(sv) : null;
  const hNat = nat.length >= 5 ? median(nat) / 2 : null;
  return { targetMs, shortVowelCount: sv.length, naturalMaddCount: nat.length,
    hSvMs: hSv, hNatMs: hNat,
    targetHarakaSv: targetMs !== null && hSv ? targetMs / hSv : null,
    targetHarakaNat: targetMs !== null && hNat ? targetMs / hNat : null };
}
export function validateMeasurement(input, clip) {
  const fail = message => { throw new Error(message); };
  if (!input || typeof input !== 'object') fail('A measurement is required.');
  const text = (value, limit = 2000) => typeof value === 'string' && value.length <= limit ? value.trim() : fail('Invalid text field.');
  const choice = (value, choices) => choices.includes(value) ? value : fail('Invalid review option.');
  const interval = item => {
    if (!item || !Number.isSafeInteger(item.start) || !Number.isSafeInteger(item.end) || item.start < 0 || item.end > clip.samples || item.end <= item.start) fail('Boundaries must lie within the clip, with end after start.');
    return { start: item.start, end: item.end };
  };
  const data = {
    protocolVersion: PROTOCOL_VERSION,
    status: choice(input.status, ['draft', 'submitted']),
    applicability: choice(input.applicability, ['pending', 'yes', 'no', 'uncertain']),
    actualStop: choice(input.actualStop, ['pending', 'stop', 'continue', 'uncertain']),
    confidence: choice(input.confidence, ['pending', 'high', 'medium', 'low']),
    alignmentConfirmed: input.alignmentConfirmed === true,
    samePaceConfirmed: input.samePaceConfirmed === true,
    subtype: text(input.subtype || '', 200),
    notes: text(input.notes || ''), calibrationNote: text(input.calibrationNote || ''),
    target: input.target == null ? null : interval(input.target),
    references: []
  };
  if (!Array.isArray(input.references) || input.references.length > 60) fail('At most 60 reference intervals are allowed.');
  const ids = new Set();
  for (const ref of input.references) {
    const id = text(ref.id, 80);
    if (!id || ids.has(id)) fail('Each reference needs a distinct identifier.');
    ids.add(id);
    data.references.push({ id, ...interval(ref), kind: choice(ref.kind, ['short_vowel', 'natural_madd']),
      label: text(ref.label || '', 200), eligible: ref.eligible === true, exclusion: text(ref.exclusion || '', 300) });
  }
  const overlaps = (a, b) => a.start < b.end && b.start < a.end;
  const eligible = data.references.filter(r => r.eligible);
  for (let i = 0; i < eligible.length; i++) {
    if (data.target && overlaps(eligible[i], data.target)) fail('The target cannot be its own timing reference.');
    if (eligible.slice(0, i).some(r => overlaps(r, eligible[i]))) fail('Eligible reference intervals must be distinct and must not overlap.');
  }
  if (data.applicability !== 'yes' && data.target) fail('Clear the target interval when applicability is not yes; absence is not zero duration.');
  if (data.status === 'submitted') {
    if (!data.alignmentConfirmed) fail('Confirm the recording and ayah alignment before submitting.');
    if (data.applicability === 'pending' || data.actualStop === 'pending' || data.confidence === 'pending') fail('Complete applicability, actual stop, and confidence.');
    if (!data.subtype) fail('Record the letter or subtype.');
    if (data.applicability !== 'yes' && data.notes.length < 10) fail('Explain a non-realized or uncertain event.');
    if (data.applicability === 'yes') {
      if (!data.target) fail('Mark the target boundaries.');
      if (!data.samePaceConfirmed) fail('Confirm that eligible references share the target’s local pace.');
      if (eligible.some(r => !r.label)) fail('Identify every eligible reference by word and vowel.');
      if (data.references.some(r => !r.eligible && !r.exclusion)) fail('Explain why a reference was excluded.');
      const s = summarize(data, clip);
      if ((s.shortVowelCount < 5 || s.naturalMaddCount < 5) && data.calibrationNote.length < 15) fail('Use five references of each kind, or explain insufficient context.');
    }
  }
  return data;
}
