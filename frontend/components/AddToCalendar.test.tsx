import { render, screen, fireEvent } from "@testing-library/react";
import AddToCalendar from "./AddToCalendar";
import type { Proposal } from "@/lib/types";

/**
 * Issue #289: the "add to calendar" button generates a .ics file and triggers
 * a download client-side. Tests verify the button renders, the download is
 * triggered, and the generated ICS content is valid RFC 5545.
 */
const mockProposal: Proposal = {
  id: "QIP-001",
  title: "Test Proposal",
  description: "This is a test proposal description",
  proposer: "GABC...3XZK",
  status: "active",
  startTime: "2026-05-12T10:00:00Z",
  endTime: "2026-05-19T10:00:00Z",
  snapshotLedger: 61_284_512,
  forVotes: 100000,
  againstVotes: 50000,
  abstainVotes: 10000,
  quorumRequired: 500000,
  category: "Financial",
  actions: [],
  votes: [],
};

describe("AddToCalendar", () => {
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    createObjectURLSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("renders the button when endTime is present", () => {
    render(<AddToCalendar proposal={mockProposal} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    expect(button).toBeInTheDocument();
  });

  it("does not render when endTime is absent", () => {
    const proposalWithoutEndTime = { ...mockProposal, endTime: "" };
    const { container } = render(<AddToCalendar proposal={proposalWithoutEndTime} />);
    
    expect(container.firstChild).toBeNull();
  });

  it("triggers download when clicked", () => {
    render(<AddToCalendar proposal={mockProposal} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    fireEvent.click(button);
    
    // Verify URL.createObjectURL was called with a Blob of correct type
    expect(createObjectURLSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text/calendar;charset=utf-8",
      })
    );
    
    // Verify URL.revokeObjectURL was called to clean up
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("generates valid ICS content with correct VEVENT structure", () => {
    render(<AddToCalendar proposal={mockProposal} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    fireEvent.click(button);
    
    // Extract the Blob content from the createObjectURL call
    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    
    // Read the blob content
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const icsContent = reader.result as string;
        
        // Verify RFC 5545 structure
        expect(icsContent).toContain("BEGIN:VCALENDAR");
        expect(icsContent).toContain("VERSION:2.0");
        expect(icsContent).toContain("PRODID:-//StellarQuorum//StellarQuorum//EN");
        expect(icsContent).toContain("BEGIN:VEVENT");
        expect(icsContent).toContain("END:VEVENT");
        expect(icsContent).toContain("END:VCALENDAR");
        
        // Verify VEVENT fields
        expect(icsContent).toContain("UID:QIP-001@stellarquorum");
        expect(icsContent).toContain("DTSTAMP:");
        expect(icsContent).toContain("DTSTART:");
        expect(icsContent).toContain("DTEND:");
        expect(icsContent).toContain("SUMMARY:Vote on: Test Proposal");
        expect(icsContent).toContain("DESCRIPTION:");
        expect(icsContent).toContain("URL:https://quorum.stellar.org/proposals/QIP-001");
        
        resolve();
      };
      reader.readAsText(blobCall);
    });
  });

  it("formats dates in UTC iCalendar format", () => {
    render(<AddToCalendar proposal={mockProposal} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    fireEvent.click(button);
    
    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const icsContent = reader.result as string;
        
        // The endTime is 2026-05-19T10:00:00Z
        // In iCal format: 20260519T100000Z
        expect(icsContent).toContain("DTSTART:20260519T100000Z");
        
        // DTEND should be 1 hour later: 20260519T110000Z
        expect(icsContent).toContain("DTEND:20260519T110000Z");
        
        resolve();
      };
      reader.readAsText(blobCall);
    });
  });

  it("escapes special characters in title and description", () => {
    const proposalWithSpecialChars: Proposal = {
      ...mockProposal,
      title: "Test; Proposal, with\\special chars",
      description: "Description with\nnewlines and; commas, and\\backslashes",
    };
    
    render(<AddToCalendar proposal={proposalWithSpecialChars} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    fireEvent.click(button);
    
    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const icsContent = reader.result as string;
        
        // Semicolons, commas, backslashes, and newlines should be escaped
        expect(icsContent).toContain("SUMMARY:Vote on: Test\\; Proposal\\, with\\\\special chars");
        expect(icsContent).toContain("Description with\\nnewlines and\\; commas\\, and\\\\backslashes");
        
        resolve();
      };
      reader.readAsText(blobCall);
    });
  });

  it("truncates long descriptions to 200 characters", () => {
    const longDescription = "a".repeat(300);
    const proposalWithLongDesc: Proposal = {
      ...mockProposal,
      description: longDescription,
    };
    
    render(<AddToCalendar proposal={proposalWithLongDesc} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    fireEvent.click(button);
    
    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const icsContent = reader.result as string;
        
        // Description should be truncated to 200 chars + "..."
        expect(icsContent).toContain("DESCRIPTION:" + "a".repeat(200) + "...");
        
        resolve();
      };
      reader.readAsText(blobCall);
    });
  });

  it("downloads file with correct filename", () => {
    const appendChildSpy = jest.spyOn(document.body, "appendChild");
    const removeChildSpy = jest.spyOn(document.body, "removeChild");
    
    render(<AddToCalendar proposal={mockProposal} />);
    
    const button = screen.getByRole("button", { name: /add voting deadline to calendar/i });
    fireEvent.click(button);
    
    // Verify a temporary anchor was created with correct download attribute
    const calls = appendChildSpy.mock.calls;
    const anchorCall = calls.find(call => call[0] instanceof HTMLAnchorElement);
    expect(anchorCall).toBeDefined();
    
    const anchor = anchorCall![0] as HTMLAnchorElement;
    expect(anchor.download).toBe("proposal-QIP-001.ics");
    expect(anchor.href).toBe("blob:mock-url");
    
    // Verify cleanup
    expect(removeChildSpy).toHaveBeenCalledWith(anchor);
    
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
