# ml-demo-kit

React components that turn a small ML inference API into an interactive live demo:

- **`TabularDemo`**: a prediction form generated from the model's schema. It offers one-click real
  examples and shows the result with the model's reasoning (a decision path or per-feature
  contributions).
- **`ExplorePanel`**: headline metrics and interactive charts: a line chart with a slider (e.g. a
  pruning curve), a threshold slider with a live confusion matrix, bar charts and comparison tables.

Every chart and form field is described by the API, so one kit renders any project that follows the
[API contract](#api-contract) below. It has no runtime dependencies besides React, and all styling
uses `--mdk-*` CSS variables.

Used by:

- [ml-purchase-prediction](https://github.com/srikarbolleddu/ml-purchase-prediction)
- [srikarbolleddu.com](https://srikarbolleddu.com)

## Install

Releases are published as GitHub Release tarballs (no npm registry):

```bash
pnpm add https://github.com/srikarbolleddu/ml-demo-kit/releases/download/v0.1.3/srikarbolleddu-ml-demo-kit-0.1.3.tgz
```

## Use

```tsx
import { ExplorePanel, TabularDemo } from "@srikarbolleddu/ml-demo-kit";
import "@srikarbolleddu/ml-demo-kit/styles.css";

const API = "https://api.example.com/api/v1";

export function Demo() {
  return (
    <>
      <TabularDemo apiUrl={API} />
      <ExplorePanel apiUrl={API} only={["pruning", "threshold"]} />
    </>
  );
}
```

Pass `client` instead of `apiUrl` to use your own data source. `createMockClient({ schema, samples,
explore, predict })` builds an in-memory client for tests and mock-API dev modes.

### States handled for you

- **Cold start:** after 2 s the loading message explains that the model is waking up.
- **Rate limits (429):** shown as a friendly "the demo is busy" message.
- **Validation errors (422/413):** shown as a short per-field message.
- **Network failures and timeouts:** shown with a retry button.

### Theming

Set variables on any ancestor of the components (or on `.mdk-root`):

```css
.my-page {
  --mdk-accent: #7c3aed;
  --mdk-bg: transparent;
  --mdk-radius: 6px;
  --mdk-font: "Inter", sans-serif;
}
```

| Variable                                       | Controls                       |
| ---------------------------------------------- | ------------------------------ |
| `--mdk-bg` / `--mdk-surface`                   | Background and panel colours   |
| `--mdk-text` / `--mdk-muted`                   | Text colours                   |
| `--mdk-border`                                 | Borders                        |
| `--mdk-accent` / `--mdk-accent-contrast`       | Accent colour and text on it   |
| `--mdk-positive` / `--mdk-negative`            | Positive and negative outcomes |
| `--mdk-series-1` … `--mdk-series-4`            | Chart series colours           |
| `--mdk-radius` / `--mdk-gap` / `--mdk-padding` | Spacing and shape              |
| `--mdk-font` / `--mdk-mono`                    | Fonts                          |

Light and dark defaults follow `prefers-color-scheme`. Set `data-mdk-theme="light"` on `<html>` to
force light mode, or set your own colour variables for each theme.

## API contract

`ml-demo-kit/v1`. All paths are relative to `apiUrl`.

| Call            | Returns                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /schema`   | `{ contract, title, description, task, target, groups[], fields[], model_version, threshold? }`. Each field is `number` (`min`/`max`/`step`/`unit`, `optional`) or `category` (`options[{value,label}]`).            |
| `GET /samples`  | `[{ title, inputs, actual }]`: real held-out examples                                                                                                                                                                |
| `POST /predict` | `{ task, score, score_label, threshold?, positive?, outcome, unit?, explanation?, model_version }`. `explanation` is `{ kind: "path" \| "contributions", title, value_label, steps[{label, field, value, count?}] }` |
| `GET /explore`  | `{ contract, headline[{label,value,format,hint?}], charts[] }`. Chart kinds: `line`, `bar`, `threshold`, `table`                                                                                                     |

All TypeScript types are in [`src/types.ts`](src/types.ts).

## Develop

```bash
pnpm install
pnpm dev                                            # playground with fixture data
open "http://localhost:5173/?api=http://localhost:8010/api/v1"   # or against a running service
pnpm test && pnpm typecheck && pnpm build
```

Release: bump `version` in `package.json`, then tag `vX.Y.Z` and push the tag. The Release workflow
attaches the packed tarball.

## License

MIT

`fixtures/purchase.json` holds responses recorded from ml-purchase-prediction. Its six example
customers come from the UCI Bank Marketing dataset (Moro, Rita & Cortez, 2014, CC BY 4.0).
