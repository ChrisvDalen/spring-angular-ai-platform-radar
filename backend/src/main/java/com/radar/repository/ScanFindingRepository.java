package com.radar.repository;

import com.radar.model.FindingCategory;
import com.radar.model.ScanFinding;
import com.radar.model.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScanFindingRepository extends JpaRepository<ScanFinding, String> {

    List<ScanFinding> findByScanIdOrderBySeverityAsc(String scanId);

    List<ScanFinding> findByScanIdAndCategory(String scanId, FindingCategory category);

    List<ScanFinding> findByScanIdAndSeverity(String scanId, Severity severity);

    long countByScanIdAndSeverity(String scanId, Severity severity);
}
