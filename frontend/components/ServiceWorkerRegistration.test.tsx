import { render } from "@testing-library/react";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

describe("ServiceWorkerRegistration", () => {
  it("renders nothing (null)", () => {
    const { container } = render(<ServiceWorkerRegistration />);
    expect(container.firstChild).toBeNull();
  });

  it("does not register when serviceWorker is not supported", () => {
    const originalServiceWorker = (global as any).navigator.serviceWorker;
    delete (global as any).navigator.serviceWorker;

    render(<ServiceWorkerRegistration />);

    (global as any).navigator.serviceWorker = originalServiceWorker;
  });
});
