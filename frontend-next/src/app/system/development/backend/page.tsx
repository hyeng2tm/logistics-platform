'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Server, ShieldCheck, Cpu, Terminal, Layers, Smartphone, ArrowDown, ArrowRightLeft, FileCode } from 'lucide-react';
import '../DevelopmentGuide.css';

const BackendGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container p-24">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <Server className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.backend.title', 'Backend Development Guide')}</h1>
          <p className="text-muted mt-2">{t('development.backend.desc', 'Standard guide for logistics platform backend development.')}</p>
        </div>
      </header>

      <div className="guide-content mt-8">
        <section className="guide-section mb-6">
          <h2>
            <Cpu size={22} className="me-2" /> {t('development.backend.tech_stack', 'Backend Tech Stack')}
          </h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Java 17 / 21</strong>
              <span>Core Language</span>
            </div>
            <div className="tech-item">
              <strong>Spring Boot 3.x</strong>
              <span>Application Framework</span>
            </div>
            <div className="tech-item">
              <strong>Spring Data JPA</strong>
              <span>ORM & Database Access</span>
            </div>
            <div className="tech-item">
              <strong>Spring Security</strong>
              <span>Authentication & Authorization (OAuth2)</span>
            </div>
            <div className="tech-item">
              <strong>H2 / PostgreSQL</strong>
              <span>Relational Database Management</span>
            </div>
            <div className="tech-item">
              <strong>MapStruct</strong>
              <span>Entity to DTO Mapping</span>
            </div>
          </div>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <Layers size={22} className="me-2" /> Architecture & Structure
          </h2>
          <pre className="code-block">
{`src/main/java/com/logistics/platform/
  config/         # Configuration (Security, Jackson, Init)
  controller/     # REST APIs & Route Definitions
  domain/         # JPA Entities
  dto/            # Request & Response Data Transfer Objects
  repository/     # Spring Data JPA interfaces
  service/        # Business Logic & Transactions`}
          </pre>

          <h3 className="mt-8 mb-4 text-lg font-bold text-slate-700">System Architecture Flow</h3>
          <div className="backend-arch-diagram mt-4">
            <div className="arch-client">
              <Smartphone size={18} /> Client (React / Next.js)
            </div>
            <div className="arch-arrow"><ArrowDown size={16} className="inline mr-1" /> REST API (JSON)</div>
            <div className="arch-server">
              <div className="arch-server-header"><Server size={18} /> Spring Boot Application</div>
              
              <div className="arch-security">
                <ShieldCheck size={16} /> Spring Security Filter Chain (OAuth2 / JWT)
              </div>
              
              <div className="arch-layers">
                <div className="arch-layer controller">
                  <div className="layer-title">Controller Layer</div>
                  <div className="layer-desc">REST Endpoints, Request Validation</div>
                  <div className="layer-dto">DTO</div>
                </div>
                
                <div className="arch-arrow-horizontal"><ArrowRightLeft size={16} /></div>
                
                <div className="arch-layer service">
                  <div className="layer-title">Service Layer</div>
                  <div className="layer-desc">Business Logic, Transaction Management</div>
                  <div className="layer-mapping">MapStruct (DTO ↔ Entity)</div>
                </div>
                
                <div className="arch-arrow-horizontal"><ArrowRightLeft size={16} /></div>
                
                <div className="arch-layer repository">
                  <div className="layer-title">Repository Layer</div>
                  <div className="layer-desc">Spring Data JPA Interfaces</div>
                  <div className="layer-entity">Entity</div>
                </div>
              </div>
            </div>
            
            <div className="arch-arrow"><ArrowDown size={16} className="inline mr-1" /> SQL Queries</div>
            
            <div className="arch-database">
              <Database size={18} /> Database (PostgreSQL / H2)
            </div>
          </div>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <Database size={22} className="me-2" /> {t('development.backend.db_standard', 'Database Standards')}
          </h2>
          <ul className="convention-list">
            <li><strong>Naming Conventions:</strong> Use <code>t_sys_</code> prefix for system/admin tables and <code>t_dom_</code> for core domain business tables.</li>
            <li><strong>Case Sensitivity:</strong> Use <code>snake_case</code> for table and column names universally in the DB.</li>
            <li><strong>Audit Logs:</strong> Include <code>created_at</code> and <code>updated_at</code> in all major tables, handled via mapped superclasses.</li>
            <li><strong>Foreign Keys:</strong> Explicitly define constraints in JPA Entities using <code>@JoinColumn</code>.</li>
          </ul>
        </section>



        <section className="guide-section mb-6">
          <h2>
            <Terminal size={22} className="me-2" /> {t('development.backend.api_standard', 'API Design')}
          </h2>
          <ul className="convention-list">
            <li><strong>RESTful Principles:</strong> Use proper HTTP methods (<code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>DELETE</code>) for CRUD operations.</li>
            <li><strong>API Versioning:</strong> All endpoints should be prefixed with <code>/api/v1/</code> to ensure backward compatibility in the future.</li>
            <li><strong>Response Structures:</strong> Return standardized payloads. Do not leak entity structures directly; convert to DTOs in the service layer.</li>
          </ul>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <FileCode size={22} className="me-2" /> {t('development.backend.crud_replication_guide', 'Standard CRUD & DB Replication Guide')}
          </h2>
          <p className="mb-4 text-muted">A standard approach for implementing CRUD operations utilizing Read/Write splitting (Master/Slave Data Sources) with Spring Boot&apos;s <code>AbstractRoutingDataSource</code>.</p>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">1. Controller Layer</h3>
              <pre className="code-block">
{`@RestController
@RequestMapping("/api/v1/feature")
@RequiredArgsConstructor
public class FeatureController {

    private final FeatureService featureService;

    @GetMapping
    public ResponseEntity<List<FeatureDto>> getAllFeatures() {
        return ResponseEntity.ok(featureService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeatureDto> getFeature(@PathVariable Long id) {
        return ResponseEntity.ok(featureService.findById(id));
    }

    @PostMapping
    public ResponseEntity<FeatureDto> createFeature(@Valid @RequestBody FeatureDto.Create request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(featureService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeatureDto> updateFeature(@PathVariable Long id, @Valid @RequestBody FeatureDto.Update request) {
        return ResponseEntity.ok(featureService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeature(@PathVariable Long id) {
        featureService.delete(id);
        return ResponseEntity.noContent().build();
    }
}`}
              </pre>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">2. Service Layer (Master Default, Explicit Slave)</h3>
              <p className="mb-2 text-sm text-slate-600">
                The logistics platform <strong>defaults all DB operations (both Read and Write) to the Master DB</strong>. The Slave DB should only be used explicitly via the <code>@Slave</code> annotation for heavy or non-critical read operations to reduce load on the Master DB.
              </p>
              <pre className="code-block">
{`@Service
@RequiredArgsConstructor
public class FeatureService {

    private final FeatureRepository featureRepository;
    private final FeatureMapper featureMapper;

    // Routes to Master DB (No Service-level transaction, implicitly uses Master)
    public List<FeatureDto> findAll() {
        return featureRepository.findAll().stream()
                .map(featureMapper::toDto)
                .collect(Collectors.toList());
    }

    // Routes to Master DB (No Service-level transaction, implicitly uses Master)
    public FeatureDto findById(Long id) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found"));
        return featureMapper.toDto(feature);
    }

    // Explicitly routes to Slave DB via readOnly = true
    @Transactional(readOnly = true)
    public List<FeatureDto> findHistoricalData() {
        return featureRepository.findHeavyHistoricalData().stream()
                .map(featureMapper::toDto)
                .collect(Collectors.toList());
    }

    // Explicitly routes to Master DB for Write operations
    @Transactional
    public FeatureDto create(FeatureDto.Create request) {
        Feature feature = featureMapper.toEntity(request);
        return featureMapper.toDto(featureRepository.save(feature));
    }

    // Explicitly routes to Master DB for Write operations
    @Transactional
    public FeatureDto update(Long id, FeatureDto.Update request) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found"));
        featureMapper.updateEntity(request, feature);
        return featureMapper.toDto(featureRepository.save(feature));
    }

    // Explicitly routes to Master DB for Write operations
    @Transactional
    public void delete(Long id) {
        if (!featureRepository.existsById(id)) {
            throw new ResourceNotFoundException("Feature not found");
        }
        featureRepository.deleteById(id);
    }
}`}
              </pre>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">3. Repository Layer</h3>
              <pre className="code-block">
{`@Repository
public interface FeatureRepository extends JpaRepository<Feature, Long> {
    // Standard CRUD methods are provided by JpaRepository
    // Add custom query methods here if needed
}`}
              </pre>
            </div>
            
            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">4. Under the Hood: Replication Routing Config</h3>
              <p className="mb-2 text-sm text-slate-600">The <code>AbstractRoutingDataSource</code> inspects the transaction&apos;s read-only status created by the <code>@Transactional</code> annotations in the service layer to determine the lookup key. It also supports explicitly forcing the route via the custom <code>@Master</code> or <code>@Slave</code> annotations.</p>
              <pre className="code-block">
{`// 1. Determine Lookup Key based on Transaction context or Custom Annotations
public class ReplicationRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        // 1. Explicitly set via @Master or @Slave annotation (AOP + ThreadLocal)
        String dataSourceType = DataSourceContextHolder.getDataSourceType();
        if (dataSourceType != null) {
            return dataSourceType;
        }

        // 2. Fallback to Spring's transaction read-only flag
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly() 
                ? "slave" 
                : "master";
    }
}

// 2. Setup the DataSources in Configuration Bean
@Configuration
public class DataSourceConfig {
    @Bean
    @Primary
    public DataSource routingDataSource(
            @Qualifier("masterDataSource") DataSource masterDataSource,
            @Qualifier("slaveDataSource") DataSource slaveDataSource) {

        ReplicationRoutingDataSource routingDataSource = new ReplicationRoutingDataSource();
        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put("master", masterDataSource);
        dataSourceMap.put("slave", slaveDataSource);

        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(masterDataSource);

    }
}`}
              </pre>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">5. Method-Level Routing Summary</h3>
              <p className="mb-2 text-sm text-slate-600">The platform defaults to the <strong>Master DB</strong> for data consistency when <code>@Transactional</code> is used (or when omitted for simple reads). To utilize the Slave DB, explicitly define <code>@Transactional(readOnly=true)</code> or use the custom <code>@Slave</code> annotation for long-running statistical queries to route traffic away from the Master nodes.</p>
              <pre className="code-block">
{`@Service
@RequiredArgsConstructor
public class ComplexReportingService {

    private final ReportRepository reportRepository;

    // Forces routing to Slave DB regardless of transaction state
    @Slave
    public ReportData generateHeavyReport() {
        return reportRepository.executeComplexQuery();
    }

    // Forces routing to Master DB, e.g., to read immediately after an external write
    @Master
    public ReportData getLatestCriticalData() {
        return reportRepository.findTopByOrderByCreatedAtDesc();
    }
}`}
              </pre>
            </div>
          </div>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <ShieldCheck size={22} className="me-2" /> {t('development.backend.security', 'Security Practices')}
          </h2>
          <p className="mb-4">
            Security is paramount in the logistics platform. Follow these strict guidelines when developing new endpoints.
          </p>
          <ul className="convention-list">
            <li><strong>Authorization:</strong> Always validate JWT tokens and meticulously check user roles at the controller level using <code>@PreAuthorize(&quot;hasRole(&apos;ROLE_ADMIN&apos;)&quot;)</code> or similar.</li>
            <li><strong>Password Storage:</strong> Never log passwords or sensitive API keys. Use <code>PasswordEncoder</code> for hashing when modifying user credentials.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default BackendGuide;
