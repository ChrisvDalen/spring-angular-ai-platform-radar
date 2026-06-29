package com.radar.dto;

import com.radar.model.FindingCategory;
import com.radar.model.ScanFinding;
import com.radar.model.Severity;

public record FindingDto(
        String id,
        FindingCategory category,
        Severity severity,
        String title,
        String description,
        String recommendation
) {
    public static FindingDto from(ScanFinding finding) {
        return new FindingDto(
                finding.getId(),
                finding.getCategory(),
                finding.getSeverity(),
                finding.getTitle(),
                finding.getDescription(),
                finding.getRecommendation()
        );
    }
}
