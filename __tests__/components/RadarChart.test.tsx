import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RadarChart from "@/components/RadarChart";
import type { DimensionScores } from "@/lib/types";

const mockScores: DimensionScores = {
  automation: 80, control: 60, toolDiversity: 70,
  contextAwareness: 40, teamImpact: 30, security: 90, agentOrchestration: 50,
};

describe("RadarChart", () => {
  it("SVG 요소를 렌더링한다", () => {
    const { container } = render(<RadarChart scores={mockScores} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("7개 축 라벨을 모두 표시한다", () => {
    const { container } = render(<RadarChart scores={mockScores} />);
    const texts = container.querySelectorAll("text");
    expect(texts.length).toBeGreaterThanOrEqual(14);
  });

  it("배경 격자(5) + 데이터(1) = 6개 폴리곤을 렌더링한다", () => {
    const { container } = render(<RadarChart scores={mockScores} />);
    expect(container.querySelectorAll("polygon").length).toBe(6);
  });

  it("모든 점수가 0이어도 렌더링된다", () => {
    const zeroScores: DimensionScores = {
      automation: 0, control: 0, toolDiversity: 0,
      contextAwareness: 0, teamImpact: 0, security: 0, agentOrchestration: 0,
    };
    const { container } = render(<RadarChart scores={zeroScores} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
