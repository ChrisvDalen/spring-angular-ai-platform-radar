package com.radar.dto;

import com.radar.model.Scan;
import com.radar.model.ScanStatus;

import java.time.Instant;
import java.util.List;

public record ScanResponse(
        String id,
        String repoName,
        String repoUrl,
        Instant createdAt,
        Instant completedAt,
        ScanStatus status,
        Integer healthScore,
        String aiSummary,

        // Detected versions
        String javaVersion,
        String springBootVersion,
        String springSecurityVersion,
        String angularVersion,
        String nodeVersion,

        // Feature flags
        Boolean zonelessEnabled,
        Boolean signalsUsed,
        Boolean dockerPresent,
        Boolean githubActionsPresent,
        Boolean openTelemetryPresent,
        Boolean dependabotPresent,

        List<FindingDto> findings
) {
    public static ScanResponse from(Scan scan) {
        return new ScanResponse(
                scan.getId(),
                scan.getRepoName(),
                scan.getRepoUrl(),
                scan.getCreatedAt(),
                scan.getCompletedAt(),
                scan.getStatus(),
                scan.getHealthScore(),
                scan.getAiSummary(),
                scan.getJavaVersion(),
                scan.getSpringBootVersion(),
                scan.getSpringSecurityVersion(),
                scan.getAngularVersion(),
                scan.getNodeVersion(),
                scan.getZonelessEnabled(),
                scan.getSignalsUsed(),
                scan.getDockerPresent(),
                scan.getGithubActionsPresent(),
                scan.getOpenTelemetryPresent(),
                scan.getDependabotPresent(),
                scan.getFindings().stream().map(FindingDto::from).toList()
        );
    }
}
