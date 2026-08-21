package com.radar.service;

import com.radar.dto.AdviceResponse;
import com.radar.model.Scan;
import com.radar.model.ScanFinding;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiAdviceService {

    private final ChatClient chatClient;

    private static final String ADVICE_PROMPT = """
            Je bent een senior Java/Spring en Angular architect met 15+ jaar ervaring.
            Analyseer de volgende scan-resultaten en geef concrete, actionable advies.

            ## Repository: {repoName}
            ## Health Score: {healthScore}/100

            ## Gedetecteerde versies:
            - Java: {javaVersion}
            - Spring Boot: {springBootVersion}
            - Angular: {angularVersion}
            - Node.js: {nodeVersion}

            ## Feature flags:
            - Zoneless Angular: {zonelessEnabled}
            - Angular Signals: {signalsUsed}
            - Docker: {dockerPresent}
            - GitHub Actions: {githubActionsPresent}
            - OpenTelemetry: {openTelemetryPresent}
            - Dependabot: {dependabotPresent}

            ## Gevonden issues:
            {findings}

            Geef advies in het volgende JSON-formaat (geen markdown eromheen, puur JSON):
            {
              "summary": "2-3 zinnen overall beoordeling",
              "quickWins": [
                {"priority": "HIGH|MEDIUM|LOW", "action": "actie", "rationale": "waarom"}
              ],
              "upgradePath": [
                {"priority": "HIGH|MEDIUM|LOW", "action": "actie", "rationale": "waarom"}
              ],
              "careerScore": "A|B|C|D",
              "careerNotes": "1-2 zinnen over portfolio/carriere waarde van dit project"
            }

            Quick wins zijn dingen die <2 uur werk kosten.
            Upgrade path zijn grotere verbeteringen.
            Maximum 5 items per lijst.
            Wees specifiek en gebruik Nederlandse taal.
            """;

    public AdviceResponse generateAdvice(Scan scan) {
        String findingsSummary = formatFindings(scan.getFindings());

        String prompt = new PromptTemplate(ADVICE_PROMPT).render(Map.ofEntries(
                Map.entry("repoName", nullSafe(scan.getRepoName())),
                Map.entry("healthScore", nullSafe(scan.getHealthScore())),
                Map.entry("javaVersion", nullSafe(scan.getJavaVersion())),
                Map.entry("springBootVersion", nullSafe(scan.getSpringBootVersion())),
                Map.entry("angularVersion", nullSafe(scan.getAngularVersion())),
                Map.entry("nodeVersion", nullSafe(scan.getNodeVersion())),
                Map.entry("zonelessEnabled", nullSafe(scan.getZonelessEnabled())),
                Map.entry("signalsUsed", nullSafe(scan.getSignalsUsed())),
                Map.entry("dockerPresent", nullSafe(scan.getDockerPresent())),
                Map.entry("githubActionsPresent", nullSafe(scan.getGithubActionsPresent())),
                Map.entry("openTelemetryPresent", nullSafe(scan.getOpenTelemetryPresent())),
                Map.entry("dependabotPresent", nullSafe(scan.getDependabotPresent())),
                Map.entry("findings", findingsSummary)
        ));

        log.info("Generating AI advice for scan {}", scan.getId());

        try {
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            return parseAdviceResponse(scan.getId(), response);
        } catch (Exception e) {
            log.error("AI advice generation failed for scan {}: {}", scan.getId(), e.getMessage());
            return fallbackAdvice(scan);
        }
    }

    private AdviceResponse parseAdviceResponse(String scanId, String json) {
        String cleaned = json.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
        return new AdviceResponse(
                scanId,
                extractJsonString(cleaned, "summary"),
                List.of(new AdviceResponse.PriorityAction("HIGH",
                        "Bekijk het volledige AI-rapport", extractJsonString(cleaned, "summary"))),
                List.of(),
                extractJsonString(cleaned, "careerScore"),
                extractJsonString(cleaned, "careerNotes")
        );
    }

    private AdviceResponse fallbackAdvice(Scan scan) {
        return new AdviceResponse(
                scan.getId(),
                "AI-analyse tijdelijk niet beschikbaar. Bekijk de scan-findings voor details.",
                List.of(
                        new AdviceResponse.PriorityAction("HIGH", "Bekijk HIGH-severity findings", "Directe actie vereist"),
                        new AdviceResponse.PriorityAction("MEDIUM", "Plan upgrade traject", "Technische schuld reduceren")
                ),
                List.of(
                        new AdviceResponse.PriorityAction("HIGH", "Upgrade verouderde dependencies", "Security en stabiliteit")
                ),
                "B",
                "Dit project toont enterprise-kennis. Moderniseer voor maximale portfolio-impact."
        );
    }

    public String generateMarkdownReport(Scan scan, AdviceResponse advice) {
        String reportPrompt = """
                Genereer een professioneel Markdown-rapport voor deze platform health scan.

                Repository: %s
                Health Score: %d/100
                AI Summary: %s

                Findings:
                %s

                Advies:
                %s

                Format als een leesbaar rapport met:
                - Executive Summary
                - Gedetailleerde bevindingen per categorie
                - Prioriteiten matrix
                - Aanbevolen acties
                - Tijdlijn schatting
                """.formatted(
                scan.getRepoName(),
                scan.getHealthScore() != null ? scan.getHealthScore() : 0,
                advice.summary(),
                formatFindings(scan.getFindings()),
                advice.quickWins().stream()
                        .map(a -> "- [%s] %s".formatted(a.priority(), a.action()))
                        .reduce("", (a, b) -> a + "\n" + b)
        );

        try {
            return chatClient.prompt()
                    .user(reportPrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Report generation failed: {}", e.getMessage());
            return generateFallbackMarkdown(scan, advice);
        }
    }

    private String generateFallbackMarkdown(Scan scan, AdviceResponse advice) {
        var sb = new StringBuilder();
        sb.append("# Platform Radar Report: ").append(scan.getRepoName()).append("\n\n");
        sb.append("**Health Score:** ").append(scan.getHealthScore()).append("/100\n\n");
        sb.append("## Samenvatting\n\n").append(advice.summary()).append("\n\n");
        sb.append("## Bevindingen\n\n");
        for (ScanFinding f : scan.getFindings()) {
            sb.append("### [").append(f.getSeverity()).append("] ").append(f.getTitle()).append("\n");
            sb.append(f.getDescription()).append("\n\n");
            sb.append("**Aanbeveling:** ").append(f.getRecommendation()).append("\n\n");
        }
        return sb.toString();
    }

    private String formatFindings(List<ScanFinding> findings) {
        return findings.stream()
                .map(f -> "[%s][%s] %s: %s".formatted(f.getSeverity(), f.getCategory(), f.getTitle(), f.getDescription()))
                .reduce("", (a, b) -> a + "\n" + b);
    }

    private String extractJsonString(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"");
        Matcher m = p.matcher(json);
        return m.find() ? m.group(1) : "";
    }

    private String nullSafe(Object value) {
        return value == null ? "onbekend" : value.toString();
    }
}
