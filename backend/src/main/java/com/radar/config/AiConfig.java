package com.radar.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("""
                        Je bent een expert Java/Spring en Angular architect.
                        Geef altijd concrete, actiegerichte adviezen in het Nederlands.
                        Gebruik technische termen correct en geef prioriteiten aan met HIGH/MEDIUM/LOW.
                        """)
                .build();
    }
}
