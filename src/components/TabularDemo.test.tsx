import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createMockClient } from "../client";
import { fixtureClient, fixtureData } from "../test/fixtureClient";
import { DemoApiError } from "../client";
import { TabularDemo } from "./TabularDemo";

describe("TabularDemo", () => {
  it("builds the form from the schema, grouped", async () => {
    render(<TabularDemo client={fixtureClient()} />);

    expect(await screen.findByRole("heading", { name: fixtureData.schema.title })).toBeVisible();
    for (const group of fixtureData.schema.groups) {
      expect(screen.getByRole("group", { name: group.label })).toBeVisible();
    }
    expect(screen.getByLabelText(/^Age/)).toHaveAttribute("min", "17");
    expect(screen.getByLabelText("Job")).toBeInstanceOf(HTMLSelectElement);
  });

  it("shows the first example's prediction without any clicks", async () => {
    render(<TabularDemo client={fixtureClient()} />);

    expect(await screen.findByRole("meter")).toBeVisible();
    expect(screen.getByText(fixtureData.samples[0]!.actual)).toBeVisible();
  });

  it("predicts a sample in one click and shows the real outcome and decision path", async () => {
    const user = userEvent.setup();
    render(<TabularDemo client={fixtureClient()} />);

    const examples = await screen.findByRole("group", { name: "Example inputs" });
    const sample = fixtureData.samples[0]!;
    await user.click(within(examples).getByRole("button", { name: sample.title }));

    expect(await screen.findByText("Likely to buy")).toBeVisible();
    expect(screen.getByRole("meter", { name: "Purchase probability" })).toHaveAttribute(
      "aria-valuenow",
      "98",
    );
    expect(screen.getByText(sample.actual)).toBeVisible();
    expect(screen.getByText("Number employed ≤ 5,088 thousand")).toBeVisible();
  });

  it("sends edited inputs and drops the real-outcome note", async () => {
    const user = userEvent.setup();
    const client = fixtureClient();
    const predict = vi.spyOn(client, "predict");
    render(<TabularDemo client={client} />);

    const age = await screen.findByLabelText(/^Age/);
    await user.clear(age);
    await user.type(age, "61");
    await user.click(screen.getByRole("button", { name: "Predict" }));

    await screen.findByRole("meter");
    expect(predict).toHaveBeenLastCalledWith(expect.objectContaining({ age: 61 }));
    expect(screen.queryByText(/Real outcome/)).not.toBeInTheDocument();
  });

  it("sends null for an optional field marked not applicable", async () => {
    const user = userEvent.setup();
    const client = fixtureClient();
    const predict = vi.spyOn(client, "predict");
    render(<TabularDemo client={client} />);

    const field = await screen.findByLabelText(/^Days since previous-campaign contact/);
    const notApplicable = within(field.closest(".mdk-field") as HTMLElement).getByRole("checkbox");
    await user.click(notApplicable);
    await user.click(screen.getByRole("button", { name: "Predict" }));

    expect(predict).toHaveBeenLastCalledWith(
      expect.objectContaining({ days_since_last_contact: null }),
    );
  });

  it("shows a friendly message when rate limited", async () => {
    const user = userEvent.setup();
    const client = {
      ...createMockClient(fixtureData, 0),
      predict: () =>
        Promise.reject(new DemoApiError("rate_limited", "The demo is busy. Please wait a minute.")),
    };
    render(<TabularDemo client={client} />);

    await user.click(await screen.findByRole("button", { name: "Predict" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The demo is busy");
  });

  it("offers a retry when the schema can't load", async () => {
    const user = userEvent.setup();
    const schema = vi
      .fn()
      .mockRejectedValueOnce(new DemoApiError("network", "Couldn't reach the model."))
      .mockResolvedValue(fixtureData.schema);
    render(<TabularDemo client={{ ...createMockClient(fixtureData, 0), schema }} />);

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: fixtureData.schema.title })).toBeVisible();
  });
});
