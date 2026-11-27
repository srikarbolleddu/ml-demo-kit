import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMockClient } from "../client";
import { fixtureClient, fixtureData } from "../test/fixtureClient";
import { ExplorePanel } from "./ExplorePanel";

describe("ExplorePanel", () => {
  it("renders the headline stats and every chart with its title", async () => {
    render(<ExplorePanel client={fixtureClient()} />);

    const headline = await screen.findByLabelText("Key results");
    expect(within(headline).getByText("Precision")).toBeVisible();
    expect(within(headline).getByText("44%")).toBeVisible();
    expect(screen.getByRole("img", { name: /Pruning/ })).toBeVisible();
    expect(screen.getByRole("list", { name: "What the tree relies on" })).toBeVisible();
    expect(screen.getByRole("table", { name: /Held-out customers/ })).toBeVisible();
  });

  it("updates the confusion matrix as the threshold slider moves", async () => {
    render(<ExplorePanel client={fixtureClient()} only={["threshold"]} />);

    const figure = (await screen.findByRole("slider")).closest("figure") as HTMLElement;
    expect(within(figure).getByText("chosen on validation data")).toBeVisible();
    const before = within(figure).getByRole("table").textContent;

    fireEvent.change(within(figure).getByRole("slider"), { target: { value: "0" } });

    expect(within(figure).getByText("5%")).toBeVisible();
    expect(within(figure).getByRole("table").textContent).not.toBe(before);
    expect(within(figure).queryByText("chosen on validation data")).not.toBeInTheDocument();
  });

  it("uses a custom badge for the selected cutoff when given", async () => {
    const data = fixtureData.explore;
    const charts = data.charts.map((c) =>
      c.kind === "threshold" ? { ...c, selected_label: "chosen by cross-validation" } : c,
    );
    const client = createMockClient({ ...fixtureData, explore: { ...data, charts } }, 0);
    render(<ExplorePanel client={client} only={["threshold"]} />);

    expect(await screen.findByText("chosen by cross-validation")).toBeVisible();
  });

  it("renders only the requested charts, in order", async () => {
    render(<ExplorePanel client={fixtureClient()} only={["comparison", "pruning"]} />);

    const figures = await screen.findAllByRole("figure");
    expect(figures.map((f) => f.id)).toEqual(["mdk-comparison", "mdk-pruning"]);
  });
});
