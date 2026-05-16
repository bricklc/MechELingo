# MechELingo

MechELingo is a minimal, Duolingo-inspired reviewer for mechanical engineering fundamentals in a Philippine board-exam review context. The pilot focuses on Greek letters that commonly appear in mechanical engineering formulas and word problems.

## Pilot subject tracks

The app uses three subject tracks to mirror the high-level PRC mechanical engineering review split:

1. **Power Plant Engineering** — thermodynamics, fluids, heat transfer, pumps, turbines, and plant operations.
2. **Mathematics** — recurring symbols for changes, angles, rotations, and problem-solving notation.
3. **Machine Design, Materials & Shop Practice** — stress, strain, shafts, beams, fasteners, columns, and manufacturing terms.

## Pilot learning modes

- **Flash cards** ask for a symbol's name, typical meaning, or common use.
- **Matching pairs** ask the learner to match a Greek symbol with either its name or its engineering meaning.
- **Sound feedback** uses generated Web Audio tones: a bell-like chime for correct answers and a short retro descending tone for wrong answers.
- **Local progress** stores lesson count, streak, and sound preference in `localStorage`.

## Development

This first pass is dependency-free and can run as a static web app.

```bash
npm run dev
```

Then open <http://localhost:5173>.

## Checks

```bash
npm run build
```

The build script verifies that all required static app files exist and that the core pilot snippets are present.
