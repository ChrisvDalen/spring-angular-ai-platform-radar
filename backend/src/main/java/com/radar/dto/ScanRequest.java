package com.radar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ScanRequest(
        @NotBlank(message = "Repo URL is required")
        @Pattern(
            regexp = "https://github\\.com/[\\w.-]+/[\\w.-]+",
            message = "Must be a valid GitHub repository URL"
        )
        String repoUrl,

        String branch
) {
    public ScanRequest {
        if (branch == null || branch.isBlank()) {
            branch = "main";
        }
    }
}
