package com.radar.repository;

import com.radar.model.Scan;
import com.radar.model.ScanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScanRepository extends JpaRepository<Scan, String> {

    List<Scan> findByStatusOrderByCreatedAtDesc(ScanStatus status);

    List<Scan> findAllByOrderByCreatedAtDesc();

    @Query("SELECT s FROM Scan s LEFT JOIN FETCH s.findings WHERE s.id = :id")
    Optional<Scan> findByIdWithFindings(String id);
}
