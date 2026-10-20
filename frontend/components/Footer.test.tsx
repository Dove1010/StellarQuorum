import { render, screen, within } from "@testing-library/react";
import Footer from "./Footer";
import { EXTERNAL_LINKS } from "@/lib/links";
import { describeVisual } from "@/test/visual";
import { expectNoA11yViolations } from "@/test/a11y";
import { RpcHealthProvider } from "@/lib/rpc-health";

// Issue #168: the footer's separator runs and muted colour are a deliberate
// visual decision. Issue #140: the link row is now part of that chrome, and a
// link that forgets `rel` opens the target with access to `window.opener`, so
// the attribute is asserted rather than left to review.
describe("Footer", () => {
  it("matches the visual baseline", () => {
    const { container } = render(
      <RpcHealthProvider>
        <Footer />
      </RpcHealthProvider>
    );
    expect(describeVisual(container.firstChild)).toMatchSnapshot();
  });

  it("links to the docs, the repository and the community channels", () => {
    render(
      <RpcHealthProvider>
        <Footer />
      </RpcHealthProvider>
    );
    const nav = screen.getByRole("navigation", { name: "Site resources" });
    for (const link of EXTERNAL_LINKS) {
      const anchor = within(nav).getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
      // RSS feed is an internal link, so skip the https check for it
      if (link.href.startsWith('/')) {
        expect(link.href).toMatch(/^\//);
      } else {
        expect(link.href).toMatch(/^https:\/\//);
      }
    }
    expect(EXTERNAL_LINKS.map((link) => link.label)).toEqual(
      expect.arrayContaining(["Docs", "Source", "Discussions", "Issues", "RSS feed"]),
    );
  });

  it("opens every external link in a new tab without leaking the opener", () => {
    const { container } = render(
      <RpcHealthProvider>
        <Footer />
      </RpcHealthProvider>
    );
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(EXTERNAL_LINKS.length);
    for (const anchor of Array.from(anchors)) {
      const href = anchor.getAttribute("href");
      // RSS feed is internal, so it should not have target="_blank"
      if (href?.startsWith("/")) {
        expect(anchor).not.toHaveAttribute("target");
      } else {
        expect(anchor).toHaveAttribute("target", "_blank");
        expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
      }
    }
  });

  it("is accessible", () => {
    const { container } = render(
      <RpcHealthProvider>
        <Footer />
      </RpcHealthProvider>
    );
    expectNoA11yViolations(container);
  });
});
