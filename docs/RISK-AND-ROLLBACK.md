# Risk Management & Rollback Plan

**Project:** Amina Dashboard - HonoX Migration  
**Purpose:** Identify risks and provide clear rollback procedures  
**Date:** 2025-12-07

---

## 1. Risk Matrix

### 1.1 Risk Assessment Scale

**Probability:** 1 (Very Low) → 5 (Very High)  
**Impact:** 1 (Minimal) → 5 (Critical)  
**Risk Score:** Probability × Impact

### 1.2 Identified Risks

| ID  | Risk                           | Probability | Impact | Score | Mitigation                                             |
| --- | ------------------------------ | ----------- | ------ | ----- | ------------------------------------------------------ |
| R1  | Server islands pattern breaks  | 4           | 5      | 20    | Test streaming SSR early; fallback to client fetch     |
| R2  | Alpine.js incompatibility      | 3           | 5      | 15    | Test in isolation; use dangerouslySetInnerHTML         |
| R3  | Authentication flow disruption | 2           | 5      | 10    | Parallel deployment; shared cookies; extensive testing |
| R4  | Database connection exhaustion | 2           | 5      | 10    | Maintain singleton pattern; monitor connections        |
| R5  | Rate limiting breaks           | 2           | 4      | 8     | Preserve exact rate limiting logic; stress test        |
| R6  | Type system errors             | 3           | 3      | 9     | Never modify `/types/*`; enforce barrel imports        |
| R7  | Performance degradation        | 3           | 4      | 12    | Benchmark continuously; optimize early                 |
| R8  | Memory leaks                   | 2           | 4      | 8     | Memory profiling; load testing                         |
| R9  | Cache invalidation issues      | 2           | 3      | 6     | Preserve cache logic; test invalidation triggers       |
| R10 | Docker build failures          | 2           | 4      | 8     | Test Docker build early; multi-stage verification      |
| R11 | Environment variable misconfig | 1           | 5      | 5     | Document all env vars; validation at startup           |
| R12 | SEO regression                 | 2           | 3      | 6     | Compare meta tags; test with SEO tools                 |
| R13 | Accessibility regression       | 2           | 3      | 6     | Automated a11y tests; manual review                    |
| R14 | Mobile responsiveness issues   | 2           | 3      | 6     | Responsive testing on real devices                     |
| R15 | Data loss during migration     | 1           | 5      | 5     | Database is unchanged; zero risk if preserved          |

### 1.3 Risk Categories

**Critical (Score 15+):**

- R1: Server islands pattern breaks
- R2: Alpine.js incompatibility

**High (Score 10-14):**

- R3: Authentication flow disruption
- R4: Database connection exhaustion
- R7: Performance degradation

**Medium (Score 5-9):**

- R5, R6, R8, R9, R10, R15

**Low (Score < 5):**

- R12, R13, R14

---

## 2. Risk Mitigation Strategies

### 2.1 Critical Risks

#### R1: Server Islands Pattern Breaks

**Description:**  
Homepage uses `server:defer` for Header component. HonoX doesn't have native server islands.

**Mitigation Strategy:**

**Phase 1: Early Testing (Week 1)**

```typescript
// Test streaming SSR immediately
export default createRoute(async (c) => {
  return c.streamSSR(async (stream) => {
    // Send skeleton first
    stream.write('<div id="header-skeleton">Loading...</div>');

    // Fetch data asynchronously
    const userData = await getDiscordUserData(c);

    // Stream real header
    stream.write(`<div id="header">${renderHeader(userData)}</div>`);
  });
});
```

**Phase 2: Fallback Implementation (Week 1)**

```typescript
// If streaming fails, use client-side fetch
<HeaderSkeleton />
<script>
  fetch('/api/header-data')
    .then(res => res.json())
    .then(data => {
      document.getElementById('header-skeleton').outerHTML = renderHeader(data);
    });
</script>
```

**Validation:**

- [ ] Skeleton appears immediately
- [ ] Real header loads within 200ms
- [ ] Fallback works without JS
- [ ] Mobile performance acceptable

#### R2: Alpine.js Incompatibility

**Description:**  
Alpine.js directives (`x-data`, `x-show`, etc.) may not work with HonoX JSX.

**Mitigation Strategy:**

**Phase 1: Isolated Testing (Week 1)**

```typescript
// Create test component
const TestAlpine = () => (
  <div dangerouslySetInnerHTML={{
    __html: `
      <div x-data="{ count: 0 }">
        <button x-on:click="count++">Increment</button>
        <span x-text="count"></span>
      </div>
    `
  }} />
);

// Test in development
// Verify:
// - Directives work
// - Reactivity works
// - No console errors
```

**Phase 2: Component Wrapper (Week 1)**

```typescript
// Create reusable Alpine wrapper
export const AlpineComponent = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

// Usage
<AlpineComponent html={`
  <div x-data="{ open: false }">
    <button x-on:click="open = !open">Toggle</button>
    <div x-show="open">Content</div>
  </div>
`} />
```

**Validation:**

- [ ] All Alpine directives work
- [ ] No XSS vulnerabilities
- [ ] Performance acceptable
- [ ] Mobile works

### 2.2 High Risks

#### R3: Authentication Flow Disruption

**Description:**  
OAuth flow with Discord may break during migration, logging out users.

**Mitigation Strategy:**

**Phase 1: Parallel Deployment (Week 7)**

```nginx
# Nginx routing
location /auth/callback {
    # Route to Astro during migration
    proxy_pass http://astro:4321;
}

location /dash {
    # Route to HonoX after verification
    proxy_pass http://honox:4322;
}
```

**Phase 2: Shared Cookie Domain**

```typescript
// Ensure both Astro and HonoX use same cookie config
const COOKIE_OPTIONS = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax' as const,
  domain: '.4mina.app', // ← Shared domain
};
```

**Phase 3: Token Migration**

```typescript
// HonoX can read Astro's cookies
const accessToken = getCookie(c, 'access_token');
// Token format is identical, no migration needed
```

**Validation:**

- [ ] Users remain logged in during cutover
- [ ] OAuth flow completes successfully
- [ ] Token refresh works
- [ ] Logout works

#### R4: Database Connection Exhaustion

**Description:**  
Multiple connections to MongoDB could exhaust pool.

**Mitigation Strategy:**

**Phase 1: Connection Monitoring (Week 2)**

```typescript
// Add connection tracking
mongoose.connection.on('open', () => {
  console.log('MongoDB connected:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

// Monitor pool size
setInterval(() => {
  const poolSize =
    mongoose.connection.db?.serverConfig?.s?.coreTopology?.s?.pool?.size;
  console.log('Current pool size:', poolSize);
}, 60000);
```

**Phase 2: Strict Singleton Enforcement**

```typescript
// Verify singleton pattern
let connectionCount = 0;

async function connectDB() {
  if (global.mongoConnection?.conn) {
    return global.mongoConnection.conn;
  }

  connectionCount++;
  console.log(`⚠️ New connection attempt #${connectionCount}`);

  if (connectionCount > 1) {
    console.error('❌ Multiple connection attempts detected!');
  }

  // ... rest of connection logic
}
```

**Validation:**

- [ ] Only 1 connection created
- [ ] Pool size stays within limits (max: 10)
- [ ] No connection errors under load
- [ ] Memory usage stable

---

## 3. Rollback Procedures

### 3.1 Immediate Rollback (Production Emergency)

**Scenario:** Critical bug discovered in production

**Timeline:** 5-10 minutes

**Steps:**

1. **Alert Team**

   ```bash
   # Send alert
   echo "🚨 ROLLBACK INITIATED" | notify-slack
   ```

2. **Switch Traffic to Astro**

   ```bash
   # Update environment variable
   export USE_HONOX=false

   # Or update Nginx config
   nginx -s reload
   ```

3. **Verify Astro Health**

   ```bash
   curl http://localhost:4321/api/status
   # Should return: { "status": "ok" }
   ```

4. **Monitor Logs**

   ```bash
   docker compose logs -f astro
   # Watch for errors
   ```

5. **Notify Users (if needed)**
   ```
   Post to status page: "Brief maintenance completed"
   ```

**Verification:**

- [ ] All traffic routed to Astro
- [ ] No 500 errors
- [ ] Authentication works
- [ ] Dashboard loads

### 3.2 Gradual Rollback (Performance Issues)

**Scenario:** HonoX is slower than expected

**Timeline:** 1-2 hours

**Steps:**

1. **Reduce HonoX Traffic**

   ```nginx
   # Route 90% to Astro, 10% to HonoX
   upstream backend {
       server astro:4321 weight=9;
       server honox:4322 weight=1;
   }
   ```

2. **Analyze Performance**

   ```bash
   # Memory profiling
   bun --inspect dist/index.js

   # Response time analysis
   artillery run load-test.yml
   ```

3. **Optimize HonoX**

   ```typescript
   // Add caching, optimize queries, etc.
   ```

4. **Gradually Increase Traffic**
   ```
   10% → 25% → 50% → 75% → 100%
   Monitor at each step
   ```

**Verification:**

- [ ] Response times acceptable (< 500ms)
- [ ] Memory usage stable (< 120MB)
- [ ] No error rate increase

### 3.3 Code Rollback (Git)

**Scenario:** Need to revert code changes

**Timeline:** 10-15 minutes

**Steps:**

1. **Identify Last Good Commit**

   ```bash
   git log --oneline
   # Find commit before migration started
   ```

2. **Create Rollback Branch**

   ```bash
   git checkout -b rollback/honox-migration
   git revert HEAD~5..HEAD  # Revert last 5 commits
   ```

3. **Test Locally**

   ```bash
   bun install
   bun run build
   bun run start
   # Verify everything works
   ```

4. **Deploy**

   ```bash
   git push origin rollback/honox-migration
   # CI/CD deploys automatically
   ```

5. **Verify Production**
   ```bash
   curl https://4mina.app/api/status
   ```

**Verification:**

- [ ] Build succeeds
- [ ] Tests pass
- [ ] Production works
- [ ] No data loss

### 3.4 Database Rollback (If Needed)

**Scenario:** Database schema changes need reverting

**⚠️ NOTE:** Current migration **DOES NOT** modify database schema, so this is unlikely.

**Timeline:** 15-30 minutes

**Steps:**

1. **Stop All Services**

   ```bash
   docker compose down
   ```

2. **Restore Backup**

   ```bash
   mongorestore --uri=$MONGO_CONNECTION --drop backup/
   ```

3. **Verify Data**

   ```bash
   mongosh $MONGO_CONNECTION
   > db.guilds.countDocuments()
   > db.users.countDocuments()
   ```

4. **Restart Services**
   ```bash
   docker compose up -d
   ```

**Verification:**

- [ ] All collections present
- [ ] Document counts match
- [ ] No data corruption

---

## 4. Phase-Specific Rollback Plans

### Phase 1: Infrastructure Foundation

**Risk:** Minimal (only setup, no production changes)

**Rollback:**

- Delete `app/` directory
- Remove HonoX dependencies from `package.json`
- Continue with Astro

### Phase 2: Core Infrastructure Port

**Risk:** Low (libraries in `app/`, not affecting `src/`)

**Rollback:**

- Keep `app/` directory for reference
- Continue using `src/` libraries
- No production impact

### Phase 3: Middleware Translation

**Risk:** Low (not yet applied to routes)

**Rollback:**

- Don't use HonoX middleware
- Keep Astro middleware
- No production impact

### Phase 4: Component Migration

**Risk:** Low (components in `app/`, not affecting `src/`)

**Rollback:**

- Keep migrated components for reference
- Continue using Astro components
- No production impact

### Phase 5: Route Migration

**Risk:** Medium (routes being migrated)

**Rollback:**

- Use feature flags to route back to Astro
- Gradually revert routes
- Monitor each reversion

### Phase 6: Progressive Cutover

**Risk:** High (production traffic switching)

**Rollback:**

- Immediate traffic switch to Astro
- Keep HonoX running for debugging
- Fix issues before retry

### Phase 7: Cleanup

**Risk:** High (removing Astro means no easy rollback)

**Rollback:**

- Restore Astro from backup
- Rebuild production
- Redeploy

---

## 5. Emergency Contacts & Procedures

### 5.1 Escalation Path

**Level 1: Minor Issue (Response Time: 15 min)**

- Developer notices issue
- Check logs, attempt quick fix
- If not resolved → Level 2

**Level 2: Moderate Issue (Response Time: 5 min)**

- Notify team lead
- Assess impact (% of users affected)
- Decide: Fix forward or rollback?
- If rollback needed → Level 3

**Level 3: Critical Issue (Response Time: Immediate)**

- Execute immediate rollback (Section 3.1)
- Notify all stakeholders
- Post-mortem meeting scheduled

### 5.2 Communication Plan

**During Rollback:**

1. Update status page: "Investigating issues"
2. Post to Discord support server
3. Update team via Slack
4. Log all actions in incident document

**After Rollback:**

1. Update status page: "Resolved"
2. Post summary to Discord
3. Schedule post-mortem
4. Document lessons learned

---

## 6. Monitoring & Alerts

### 6.1 Key Metrics to Monitor

**System Health:**

- Response time (p50, p95, p99)
- Error rate (%)
- Memory usage (MB)
- CPU usage (%)
- Database connections

**Business Metrics:**

- Active users
- Authentication success rate
- API error rate
- Dashboard load time

**Thresholds for Alerts:**

| Metric        | Warning | Critical | Action                         |
| ------------- | ------- | -------- | ------------------------------ |
| Response time | > 500ms | > 1000ms | Rollback                       |
| Error rate    | > 1%    | > 5%     | Immediate rollback             |
| Memory usage  | > 100MB | > 150MB  | Investigate, possible rollback |
| Auth failures | > 2%    | > 10%    | Immediate rollback             |

### 6.2 Monitoring Setup

```typescript
// app/middleware/monitoring.ts
import { createMiddleware } from 'hono/factory';

let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;

export const monitoring = createMiddleware(async (c, next) => {
  const start = Date.now();
  requestCount++;

  try {
    await next();
  } catch (error) {
    errorCount++;
    throw error;
  } finally {
    const duration = Date.now() - start;
    totalResponseTime += duration;

    // Alert if error rate > 5%
    if (errorCount / requestCount > 0.05) {
      console.error('🚨 Error rate above 5%!');
      // Send alert
    }

    // Alert if avg response time > 500ms
    const avgResponseTime = totalResponseTime / requestCount;
    if (avgResponseTime > 500) {
      console.warn('⚠️ Average response time above 500ms');
    }
  }
});
```

---

## 7. Testing Before Rollback

### 7.1 Pre-Rollback Checklist

Before executing rollback, verify:

- [ ] Issue is confirmed (not a false alarm)
- [ ] Impact is significant (affects > 10% of users)
- [ ] Quick fix is not possible (< 5 minutes)
- [ ] Team lead is notified
- [ ] Status page is updated
- [ ] Rollback procedure is reviewed

### 7.2 Post-Rollback Verification

After rollback, verify:

- [ ] All services healthy
- [ ] No 500 errors
- [ ] Authentication works
- [ ] Dashboard loads
- [ ] Database intact
- [ ] Users notified
- [ ] Post-mortem scheduled

---

## 8. Lessons Learned Template

After any rollback, complete this template:

```markdown
# Incident Post-Mortem

**Date:** YYYY-MM-DD
**Duration:** X hours
**Impact:** X% of users affected

## What Happened?

[Describe the issue]

## Root Cause

[What caused the issue?]

## Timeline

- HH:MM - Issue detected
- HH:MM - Team notified
- HH:MM - Rollback initiated
- HH:MM - Service restored

## What Went Well?

- [List positives]

## What Went Wrong?

- [List negatives]

## Action Items

- [ ] [Action 1] - Owner: X
- [ ] [Action 2] - Owner: Y

## Prevention

[How to prevent this in the future?]
```

---

## 9. Success Criteria for "No Rollback Needed"

Migration is successful when:

- [ ] All routes migrated and tested
- [ ] No increase in error rate (< 0.5%)
- [ ] Response time improved or maintained
- [ ] Memory usage reduced by 30%+
- [ ] All tests passing
- [ ] Zero critical bugs reported
- [ ] User satisfaction maintained
- [ ] Production stable for 2 weeks

---

## 10. Final Checklist

Before removing Astro entirely:

- [ ] All routes migrated
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Memory usage improved
- [ ] Production stable for 2 weeks
- [ ] Post-migration review complete
- [ ] Documentation updated
- [ ] Team trained on HonoX
- [ ] Rollback procedure tested (in staging)
- [ ] Backup of Astro code archived

---

**Document Status:** REFERENCE - Use during migration  
**Last Updated:** 2025-12-07  
**Version:** 1.0
