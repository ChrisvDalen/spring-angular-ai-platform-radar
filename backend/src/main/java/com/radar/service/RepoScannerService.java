package com.radar.service;

import com.radar.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scans a GitHub repository for technology versions and potential issues.
 * Inspects pom.xml, package.json, Dockerfile, and GitHub Actions workflows.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RepoScannerService {

    private static final Pattern POM_SPRING_BOOT = Pattern.compile(
            "<version>(\\d+\\.\\d+\\.\\d+[\\w.-]*)</version>.*?spring-boot",
            Pattern.DOTALL
    );
    private static final Pattern POM_JAVA = Pattern.compile(
            "<java\\.version>(\\d+)</java\\.version>"
    );
    private static final Pattern POM_SPRING_SECURITY = Pattern.compile(
            "spring-security[^<]*<version>([^<]+)</version>"
    );
    private static final Pattern PARENT_SPRING_BOOT = Pattern.compile(
            "<parent>[\\s\\S]*?<artifactId>spring-boot-starter-parent</artifactId>[\\s\\S]*?<version>([^<]+)</version>",
            Pattern.DOTALL
    );
    private static final Pattern ANGULAR_VERSION = Pattern.compile(
            "\"@angular/core\"\\s*:\\s*\"[~^]?(\\d+\\.\\d+\\.\\d+)"
    );
    private static final Pattern NODE_VERSION = Pattern.compile(
            "\"node\"\\s*:\\s*\"[>=~^]*(\\d+)"
    );

    private final GitHub gitHub;

    public ScanResult scanRepository(String repoUrl, String branch) {
        String repoName = extractRepoName(repoUrl);
        log.info("Starting scan for repository: {}", repoName);

        var result = new ScanResult();
        result.repoName = repoName;
        result.findings = new ArrayList<>();

        try {
            GHRepository repo = gitHub.getRepository(repoName);

            scanPomXml(repo, branch, result);
            scanPackageJson(repo, branch, result);
            scanDockerfile(repo, branch, result);
            scanGitHubActions(repo, result);
            scanOpenTelemetry(repo, branch, result);

            result.healthScore = calculateHealthScore(result);

        } catch (IOException e) {
            log.error("Failed to scan repository {}: {}", repoName, e.getMessage());
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.DEVOPS)
                    .severity(Severity.HIGH)
                    .title("Repository access failed")
                    .description("Could not access repository: " + e.getMessage())
                    .recommendation("Ensure the repository is public or provide a valid GitHub token.")
                    .build());
        }

        return result;
    }

    private void scanPomXml(GHRepository repo, String branch, ScanResult result) {
        try {
            String content = getFileContent(repo, "pom.xml", branch);
            if (content == null) {
                result.findings.add(noBackendFinding());
                return;
            }

            // Detect Spring Boot version
            Matcher sbMatcher = PARENT_SPRING_BOOT.matcher(content);
            if (sbMatcher.find()) {
                result.springBootVersion = sbMatcher.group(1);
                addSpringBootFindings(result);
            }

            // Detect Java version
            Matcher javaMatcher = POM_JAVA.matcher(content);
            if (javaMatcher.find()) {
                result.javaVersion = javaMatcher.group(1);
                addJavaFindings(result);
            }

            // Detect Spring Security
            if (content.contains("spring-boot-starter-security")) {
                result.springSecurityVersion = result.springBootVersion;
            }

            // Check for OpenTelemetry in pom
            if (content.contains("micrometer-tracing") || content.contains("opentelemetry")) {
                result.openTelemetryPresent = true;
            }

        } catch (Exception e) {
            log.debug("No pom.xml found or parse error: {}", e.getMessage());
        }
    }

    private void scanPackageJson(GHRepository repo, String branch, ScanResult result) {
        String[] paths = {"package.json", "frontend/package.json", "client/package.json"};
        for (String path : paths) {
            try {
                String content = getFileContent(repo, path, branch);
                if (content == null) continue;

                // Detect Angular version
                Matcher angularMatcher = ANGULAR_VERSION.matcher(content);
                if (angularMatcher.find()) {
                    result.angularVersion = angularMatcher.group(1);
                    addAngularFindings(repo, branch, result, content);
                }

                // Detect Node version
                Matcher nodeMatcher = NODE_VERSION.matcher(content);
                if (nodeMatcher.find()) {
                    result.nodeVersion = nodeMatcher.group(1);
                }

                break;
            } catch (Exception e) {
                log.debug("package.json not found at {}: {}", path, e.getMessage());
            }
        }
    }

    private void addAngularFindings(GHRepository repo, String branch, ScanResult result, String packageJson) {
        // Check for Zone.js
        boolean hasZoneJs = packageJson.contains("\"zone.js\"");
        result.zonelessEnabled = !hasZoneJs;

        if (hasZoneJs) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.FRONTEND)
                    .severity(Severity.MEDIUM)
                    .title("Zone.js aanwezig — nog niet zoneless")
                    .description("De Angular applicatie gebruikt nog Zone.js voor change detection.")
                    .recommendation("Migreer naar Angular Zoneless (provideExperimentalZonelessChangeDetection) " +
                            "voor betere performance en tree-shaking. Gebruik Signals voor reactieve state.")
                    .build());
        }

        // Check for Signals usage
        try {
            String appContent = getFileContent(repo, "src/app/app.component.ts", branch);
            result.signalsUsed = appContent != null && (
                    appContent.contains("signal(") || appContent.contains("computed(") || appContent.contains("effect(")
            );
        } catch (Exception e) {
            result.signalsUsed = false;
        }

        if (Boolean.FALSE.equals(result.signalsUsed)) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.FRONTEND)
                    .severity(Severity.MEDIUM)
                    .title("Angular Signals niet of nauwelijks gebruikt")
                    .description("Signals zijn de moderne reactieve primitief in Angular en vervangen RxJS voor lokale state.")
                    .recommendation("Vervang eenvoudige BehaviorSubjects door signal(), computed() en effect(). " +
                            "Begin met leaf-components en werk omhoog.")
                    .build());
        }

        int majorVersion = parseMajorVersion(result.angularVersion);
        if (majorVersion > 0 && majorVersion < 17) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.FRONTEND)
                    .severity(Severity.HIGH)
                    .title("Angular versie verouderd: " + result.angularVersion)
                    .description("Angular " + majorVersion + " is EOL. Moderne features zoals Signals, " +
                            "Standalone Components en Zoneless zijn niet beschikbaar.")
                    .recommendation("Upgrade stapsgewijs via ng update @angular/core @angular/cli. " +
                            "Volg het Angular upgrade guide op update.angular.io.")
                    .build());
        }
    }

    private void addSpringBootFindings(ScanResult result) {
        if (result.springBootVersion == null) return;
        int[] parts = parseVersion(result.springBootVersion);
        int major = parts[0], minor = parts[1];

        if (major < 3) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.BACKEND)
                    .severity(Severity.HIGH)
                    .title("Spring Boot " + result.springBootVersion + " is EOL")
                    .description("Spring Boot " + major + ".x ontvangt geen security patches meer. " +
                            "Dit is een significant beveiligingsrisico voor productie-applicaties.")
                    .recommendation("Upgrade naar Spring Boot 3.5.x. Migreer Jakarta EE namespaces " +
                            "(javax.* → jakarta.*) en verwijder verouderde configuratie.")
                    .build());
        } else if (major == 3 && minor < 4) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.BACKEND)
                    .severity(Severity.MEDIUM)
                    .title("Spring Boot " + result.springBootVersion + " nadert EOL")
                    .description("Spring Boot " + major + "." + minor + " ontvangt binnenkort geen updates meer.")
                    .recommendation("Plan upgrade naar Spring Boot 3.5.x. Controleer de Spring Boot support policy.")
                    .build());
        }
    }

    private void addJavaFindings(ScanResult result) {
        if (result.javaVersion == null) return;
        int major = Integer.parseInt(result.javaVersion.replaceAll("[^\\d].*", ""));

        if (major < 17) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.BACKEND)
                    .severity(Severity.HIGH)
                    .title("Java " + result.javaVersion + " is EOL")
                    .description("Java " + major + " ontvangt geen security-updates meer. " +
                            "Spring Boot 3.x vereist minimaal Java 17.")
                    .recommendation("Upgrade naar Java 21 (LTS). Profiteer van Records, Pattern Matching, " +
                            "Virtual Threads (Loom) en Sealed Classes.")
                    .build());
        } else if (major == 17) {
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.BACKEND)
                    .severity(Severity.LOW)
                    .title("Java 17 — upgrade naar Java 21 aanbevolen")
                    .description("Java 21 is de nieuwste LTS-release met Virtual Threads, " +
                            "Sequenced Collections en verbeterde Pattern Matching.")
                    .recommendation("Upgrade naar Java 21 voor betere performance en nieuwe taalfeatures.")
                    .build());
        }
    }

    private void scanDockerfile(GHRepository repo, String branch, ScanResult result) {
        try {
            String content = getFileContent(repo, "Dockerfile", branch);
            result.dockerPresent = content != null;
            if (content != null && content.contains("FROM") && !content.contains("USER ")) {
                result.findings.add(ScanFinding.builder()
                        .category(FindingCategory.SECURITY)
                        .severity(Severity.MEDIUM)
                        .title("Dockerfile draait als root")
                        .description("Er is geen non-root USER gedefinieerd in het Dockerfile. " +
                                "Dit vergroot het aanvalsoppervlak bij een container escape.")
                        .recommendation("Voeg toe: RUN addgroup -S appgroup && adduser -S appuser -G appgroup\n" +
                                "USER appuser")
                        .build());
            }
        } catch (Exception e) {
            result.dockerPresent = false;
            result.findings.add(ScanFinding.builder()
                    .category(FindingCategory.DEVOPS)
                    .severity(Severity.LOW)
                    .title("Geen Dockerfile gevonden")
                    .description("De repository bevat geen Dockerfile voor containerisatie.")
                    .recommendation("Voeg een multi-stage Dockerfile toe met een JRE-base image voor productie.")
                    .build());
        }
    }

    private void scanGitHubActions(GHRepository repo, ScanResult result) {
        try {
            GHContent workflowDir = repo.getDirectoryContent(".github/workflows")
                    .stream().findFirst().orElse(null);
            result.githubActionsPresent = workflowDir != null;

            if (result.githubActionsPresent) {
                boolean hasDependencyCheck = repo.getDirectoryContent(".github/workflows").stream()
                        .anyMatch(f -> {
                            try {
                                String c = new String(f.read().readAllBytes());
                                return c.contains("dependency-check") || c.contains("dependabot") || c.contains("trivy");
                            } catch (IOException e) {
                                return false;
                            }
                        });
                result.dependabotPresent = hasDependencyCheck;

                if (!hasDependencyCheck) {
                    result.findings.add(ScanFinding.builder()
                            .category(FindingCategory.SECURITY)
                            .severity(Severity.MEDIUM)
                            .title("GitHub Actions mist dependency scanning")
                            .description("CI/CD pipeline scant dependencies niet op bekende kwetsbaarheden.")
                            .recommendation("Voeg Dependabot toe (dependabot.yml) of integreer Trivy/OWASP " +
                                    "Dependency-Check in je workflow.")
                            .build());
                }
            } else {
                result.githubActionsPresent = false;
                result.dependabotPresent = false;
                result.findings.add(ScanFinding.builder()
                        .category(FindingCategory.DEVOPS)
                        .severity(Severity.MEDIUM)
                        .title("Geen GitHub Actions CI/CD pipeline")
                        .description("Er is geen geautomatiseerde CI/CD pipeline geconfigureerd.")
                        .recommendation("Voeg een GitHub Actions workflow toe voor build, test en security scanning.")
                        .build());
            }
        } catch (Exception e) {
            result.githubActionsPresent = false;
            result.dependabotPresent = false;
        }
    }

    private void scanOpenTelemetry(GHRepository repo, String branch, ScanResult result) {
        if (Boolean.TRUE.equals(result.openTelemetryPresent)) return;
        try {
            String appYml = getFileContent(repo, "src/main/resources/application.yml", branch);
            boolean hasOtel = appYml != null && (
                    appYml.contains("management.tracing") || appYml.contains("otel") || appYml.contains("jaeger")
            );
            result.openTelemetryPresent = hasOtel;
            if (!hasOtel) {
                result.findings.add(ScanFinding.builder()
                        .category(FindingCategory.OBSERVABILITY)
                        .severity(Severity.MEDIUM)
                        .title("Geen OpenTelemetry / distributed tracing")
                        .description("Observability is niet geconfigureerd. Problemen in productie zijn " +
                                "moeilijk te debuggen zonder tracing en metrics.")
                        .recommendation("Voeg micrometer-tracing-bridge-otel toe en configureer een " +
                                "OTLP exporter naar Jaeger of Grafana Tempo.")
                        .build());
            }
        } catch (Exception e) {
            result.openTelemetryPresent = false;
        }
    }

    private int calculateHealthScore(ScanResult result) {
        int score = 100;
        for (ScanFinding finding : result.findings) {
            score -= switch (finding.getSeverity()) {
                case HIGH -> 15;
                case MEDIUM -> 8;
                case LOW -> 3;
                case INFO -> 0;
            };
        }
        if (Boolean.TRUE.equals(result.dockerPresent)) score += 5;
        if (Boolean.TRUE.equals(result.githubActionsPresent)) score += 5;
        if (Boolean.TRUE.equals(result.openTelemetryPresent)) score += 5;
        if (Boolean.TRUE.equals(result.zonelessEnabled)) score += 3;
        if (Boolean.TRUE.equals(result.signalsUsed)) score += 2;

        return Math.max(0, Math.min(100, score));
    }

    private String getFileContent(GHRepository repo, String path, String branch) throws IOException {
        try {
            GHContent content = repo.getFileContent(path, branch);
            if (content == null) return null;
            return new String(content.read().readAllBytes());
        } catch (GHFileNotFoundException e) {
            return null;
        }
    }

    private String extractRepoName(String repoUrl) {
        return repoUrl.replace("https://github.com/", "").replaceAll("\\.git$", "");
    }

    private int[] parseVersion(String version) {
        try {
            String[] parts = version.split("\\.");
            return new int[]{
                    Integer.parseInt(parts[0]),
                    parts.length > 1 ? Integer.parseInt(parts[1]) : 0,
                    parts.length > 2 ? Integer.parseInt(parts[2].replaceAll("[^\\d].*", "")) : 0
            };
        } catch (NumberFormatException e) {
            return new int[]{0, 0, 0};
        }
    }

    private int parseMajorVersion(String version) {
        if (version == null) return 0;
        try {
            return Integer.parseInt(version.split("\\.")[0]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private ScanFinding noBackendFinding() {
        return ScanFinding.builder()
                .category(FindingCategory.BACKEND)
                .severity(Severity.INFO)
                .title("Geen pom.xml gevonden")
                .description("Dit lijkt geen Maven-project te zijn.")
                .recommendation("Controleer of het een Gradle-project is. Gradle-ondersteuning wordt binnenkort toegevoegd.")
                .build();
    }

    public static class ScanResult {
        public String repoName;
        public String javaVersion;
        public String springBootVersion;
        public String springSecurityVersion;
        public String angularVersion;
        public String nodeVersion;
        public Boolean zonelessEnabled;
        public Boolean signalsUsed;
        public Boolean dockerPresent;
        public Boolean githubActionsPresent;
        public Boolean openTelemetryPresent;
        public Boolean dependabotPresent;
        public Integer healthScore;
        public List<ScanFinding> findings;
    }
}
