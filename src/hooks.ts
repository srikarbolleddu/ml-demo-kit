import { useEffect, useState } from "react";

/** True once `active` has stayed true for `delayMs`, e.g. to explain a slow cold start. */
export function useDelayedFlag(active: boolean, delayMs = 2000): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (!active) {
      setFlag(false);
      return;
    }
    const timer = setTimeout(() => setFlag(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return flag;
}

export type Loadable<T> =
  { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: T };

/** Load data once per `load` identity; ignores results that arrive after unmount. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): [Loadable<T>, () => void] {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    load().then(
      (data) => live && setState({ status: "ready", data }),
      (error: unknown) => live && setState({ status: "error", error }),
    );
    return () => {
      live = false;
    };
  }, [...deps, attempt]);
  return [state, () => setAttempt((n) => n + 1)];
}
