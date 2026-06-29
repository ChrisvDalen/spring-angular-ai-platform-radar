CREATE TABLE scan (
    id                      VARCHAR(36) PRIMARY KEY,
    repo_name               VARCHAR(255) NOT NULL,
    repo_url                VARCHAR(500) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMPTZ,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    health_score            INTEGER,
    ai_summary              TEXT,
    report_markdown         TEXT,

    java_version            VARCHAR(20),
    spring_boot_version     VARCHAR(20),
    spring_security_version VARCHAR(20),
    angular_version         VARCHAR(20),
    node_version            VARCHAR(20),

    zoneless_enabled        BOOLEAN,
    signals_used            BOOLEAN,
    docker_present          BOOLEAN,
    github_actions_present  BOOLEAN,
    open_telemetry_present  BOOLEAN,
    dependabot_present      BOOLEAN
);

CREATE TABLE scan_finding (
    id              VARCHAR(36) PRIMARY KEY,
    scan_id         VARCHAR(36) NOT NULL REFERENCES scan(id) ON DELETE CASCADE,
    category        VARCHAR(30) NOT NULL,
    severity        VARCHAR(10) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    recommendation  TEXT
);

CREATE INDEX idx_scan_status ON scan(status);
CREATE INDEX idx_scan_created_at ON scan(created_at DESC);
CREATE INDEX idx_finding_scan_id ON scan_finding(scan_id);
CREATE INDEX idx_finding_severity ON scan_finding(severity);
