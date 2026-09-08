import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MatchResultCard from "../src/components/recruiter/MatchResultCard";

describe("MatchResultCard — supporting reasons vs concerns", () => {
  it("never renders a concern under the supporting-match heading", () => {
    const match = {
      totalScore: 0.87,
      scoreBreakdown: { skills: 1, experience: 1, semantic: 0.3, education: 1 },
      matchedSkills: ["excel"],
      missingSkills: [],
      supportingReasons: ["meets or exceeds the required experience"],
      concerns: ["shows low contextual relevance to the role"],
    };

    render(<MatchResultCard match={match} />);

    const supportingSection = screen.getByRole("heading", { name: "What supports this match" }).closest("section");
    expect(supportingSection).toHaveTextContent("meets or exceeds the required experience");
    expect(supportingSection).not.toHaveTextContent("shows low contextual relevance to the role");

    expect(screen.getByRole("heading", { name: "Worth reviewing further" })).toBeInTheDocument();
    expect(screen.getByText("shows low contextual relevance to the role")).toBeInTheDocument();
  });

  it("does not render the concerns section at all when there are none", () => {
    const match = {
      totalScore: 1,
      scoreBreakdown: {},
      matchedSkills: [],
      missingSkills: [],
      supportingReasons: ["satisfies the education requirements"],
      concerns: [],
    };

    render(<MatchResultCard match={match} />);

    expect(screen.queryByRole("heading", { name: "Worth reviewing further" })).not.toBeInTheDocument();
  });
});
