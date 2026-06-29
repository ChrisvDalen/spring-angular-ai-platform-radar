package com.radar.config;

import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class GitHubConfig {

    @Value("${radar.github.token:}")
    private String githubToken;

    @Bean
    public GitHub gitHub() throws IOException {
        if (githubToken == null || githubToken.isBlank()) {
            return GitHub.connectAnonymously();
        }
        return new GitHubBuilder().withOAuthToken(githubToken).build();
    }
}
