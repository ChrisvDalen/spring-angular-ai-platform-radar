package com.radar.service;

import com.radar.dto.AdviceResponse;
import com.radar.dto.ScanRequest;
import com.radar.dto.ScanResponse;
import com.radar.model.Scan;
import com.radar.model.ScanFinding;
import com.radar.model.ScanStatus;
import com.radar.repository.ScanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScanService {

    private final ScanRepository scanRepository;
    private final RepoScannerService repoScannerService;
    private final AiAdviceService aiAdviceService;

    @Transactional
    public ScanResponse initiateScan(ScanRequest request) {
        String repoName = extractRepoName(request.repoUrl());

        Scan scan = Scan.builder()
                .repoName(repoName)
                .repoUrl(request.repoUrl())
                .status(ScanStatus.PENDING)
                .build();

        scan = scanRepository.save(scan);
        log.info("Scan initiated: id={} repo={}", scan.getId(), repoName);

        performScanAsync(scan.getId(), request);
        return ScanResponse.from(scan);
    }

    @Async
    public void performScanAsync(String scanId, ScanRequest request) {
        Scan scan = scanRepository.findById(scanId).orElseThrow();
        try {
            scan.setStatus(ScanStatus.SCANNING);
            scanRepository.save(scan);

            // Phase 1: Repository scanning
            RepoScannerService.ScanResult result = repoScannerService.scanRepository(
                    request.repoUrl(), request.branch()
            );

            applyResultToScan(scan, result);
            scan.setStatus(ScanStatus.COMPLETED);
            scan.setCompletedAt(Instant.now());
            scan = scanRepository.save(scan);

            // Phase 2: AI advice generation
            AdviceResponse advice = aiAdviceService.generateAdvice(scan);
            scan.setAiSummary(advice.summary());

            String report = aiAdviceService.generateMarkdownReport(scan, advice);
            scan.setReportMarkdown(report);
            scanRepository.save(scan);

            log.info("Scan completed: id={} score={}", scanId, scan.getHealthScore());

        } catch (Exception e) {
            log.error("Scan failed: id={} error={}", scanId, e.getMessage(), e);
            scan.setStatus(ScanStatus.FAILED);
            scanRepository.save(scan);
        }
    }

    @Transactional(readOnly = true)
    public ScanResponse getScan(String scanId) {
        Scan scan = scanRepository.findByIdWithFindings(scanId)
                .orElseThrow(() -> new NoSuchElementException("Scan not found: " + scanId));
        return ScanResponse.from(scan);
    }

    @Transactional(readOnly = true)
    public AdviceResponse getAdvice(String scanId) {
        Scan scan = scanRepository.findByIdWithFindings(scanId)
                .orElseThrow(() -> new NoSuchElementException("Scan not found: " + scanId));

        if (scan.getStatus() != ScanStatus.COMPLETED) {
            throw new IllegalStateException("Scan is not yet completed: " + scan.getStatus());
        }

        return aiAdviceService.generateAdvice(scan);
    }

    @Transactional(readOnly = true)
    public String getReport(String scanId) {
        Scan scan = scanRepository.findById(scanId)
                .orElseThrow(() -> new NoSuchElementException("Scan not found: " + scanId));

        if (scan.getReportMarkdown() != null) {
            return scan.getReportMarkdown();
        }

        return "# Rapport nog niet beschikbaar\n\nDe scan is nog bezig of er is een fout opgetreden.";
    }

    @Transactional(readOnly = true)
    public List<ScanResponse> getAllScans() {
        return scanRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ScanResponse::from)
                .toList();
    }

    private void applyResultToScan(Scan scan, RepoScannerService.ScanResult result) {
        scan.setJavaVersion(result.javaVersion);
        scan.setSpringBootVersion(result.springBootVersion);
        scan.setSpringSecurityVersion(result.springSecurityVersion);
        scan.setAngularVersion(result.angularVersion);
        scan.setNodeVersion(result.nodeVersion);
        scan.setZonelessEnabled(result.zonelessEnabled);
        scan.setSignalsUsed(result.signalsUsed);
        scan.setDockerPresent(result.dockerPresent);
        scan.setGithubActionsPresent(result.githubActionsPresent);
        scan.setOpenTelemetryPresent(result.openTelemetryPresent);
        scan.setDependabotPresent(result.dependabotPresent);
        scan.setHealthScore(result.healthScore);

        for (ScanFinding finding : result.findings) {
            finding.setScan(scan);
            scan.getFindings().add(finding);
        }
    }

    private String extractRepoName(String repoUrl) {
        return repoUrl.replace("https://github.com/", "").replaceAll("\\.git$", "");
    }
}
