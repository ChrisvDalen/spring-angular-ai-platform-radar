package com.radar;

import com.radar.dto.ScanRequest;
import com.radar.dto.ScanResponse;
import com.radar.model.ScanStatus;
import com.radar.service.ScanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ScanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ScanService scanService;

    @Test
    void startScan_returnsAccepted() throws Exception {
        ScanRequest request = new ScanRequest("https://github.com/spring-projects/spring-boot", "main");
        ScanResponse mockResponse = new ScanResponse(
                "test-id", "spring-projects/spring-boot",
                "https://github.com/spring-projects/spring-boot",
                Instant.now(), null, ScanStatus.PENDING,
                null, null, null, null, null, null, null,
                null, null, null, null, null, null, List.of()
        );

        when(scanService.initiateScan(any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/scans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.id").value("test-id"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void startScan_invalidUrl_returnsBadRequest() throws Exception {
        ScanRequest request = new ScanRequest("not-a-github-url", "main");

        mockMvc.perform(post("/api/scans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllScans_returnsList() throws Exception {
        when(scanService.getAllScans()).thenReturn(List.of());

        mockMvc.perform(get("/api/scans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getScan_notFound_returns404() throws Exception {
        when(scanService.getScan("nonexistent"))
                .thenThrow(new java.util.NoSuchElementException("Scan not found: nonexistent"));

        mockMvc.perform(get("/api/scans/nonexistent"))
                .andExpect(status().isNotFound());
    }
}
