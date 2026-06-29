package com.radar.controller;

import com.radar.dto.AdviceResponse;
import com.radar.dto.ScanRequest;
import com.radar.dto.ScanResponse;
import com.radar.service.ScanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scans")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:80"})
public class ScanController {

    private final ScanService scanService;

    @PostMapping
    public ResponseEntity<ScanResponse> startScan(@Valid @RequestBody ScanRequest request) {
        ScanResponse response = scanService.initiateScan(request);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping
    public ResponseEntity<List<ScanResponse>> getAllScans() {
        return ResponseEntity.ok(scanService.getAllScans());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScanResponse> getScan(@PathVariable String id) {
        return ResponseEntity.ok(scanService.getScan(id));
    }

    @GetMapping("/{id}/advice")
    public ResponseEntity<AdviceResponse> getAdvice(@PathVariable String id) {
        return ResponseEntity.ok(scanService.getAdvice(id));
    }

    @GetMapping(value = "/{id}/report.md", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getReport(@PathVariable String id) {
        String report = scanService.getReport(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"radar-report.md\"")
                .body(report);
    }
}
