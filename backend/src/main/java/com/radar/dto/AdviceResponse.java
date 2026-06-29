package com.radar.dto;

import java.util.List;

public record AdviceResponse(
        String scanId,
        String summary,
        List<PriorityAction> quickWins,
        List<PriorityAction> upgradePath,
        String careerScore,
        String careerNotes
) {
    public record PriorityAction(
            String priority,
            String action,
            String rationale
    ) {}
}
