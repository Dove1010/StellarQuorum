import { render, screen } from "@testing-library/react";
import OfflinePage from "./page";

describe("OfflinePage", () => {
  it("renders the offline message with a retry button", () => {
    render(<OfflinePage />);

    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    expect(screen.getByText(/quorum displays live governance data/i)).toBeInTheDocument();
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
  });

  it("refreshes the page when retry is clicked", () => {
    const reload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true,
    });

    const { getByText } = render(<OfflinePage />);
    getByText("Retry").click();

    expect(reload).toHaveBeenCalled();
  });
});
