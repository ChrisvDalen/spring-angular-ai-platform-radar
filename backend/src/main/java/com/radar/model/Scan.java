package com.radar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String repoName;

    @Column(nullable = false)
    private String repoUrl;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant completedAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ScanStatus status;

    private Integer healthScore;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String reportMarkdown;

    // Detected versions
    private String javaVersion;
    private String springBootVersion;
    private String springSecurityVersion;
    private String angularVersion;
    private String nodeVersion;

    // Feature flags
    private Boolean zonelessEnabled;
    private Boolean signalsUsed;
    private Boolean dockerPresent;
    private Boolean githubActionsPresent;
    private Boolean openTelemetryPresent;
    private Boolean dependabotPresent;

    @OneToMany(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScanFinding> findings = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = ScanStatus.PENDING;
    }
}
