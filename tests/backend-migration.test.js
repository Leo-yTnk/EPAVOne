// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
describe('exclusive backend ownership', () => {
  it('gates a manual deployment and never automatically applies consolidated history', () => {
    const workflow = read('.github/workflows/deploy-swift-price-sync.yml');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("vars.EPAVONE_BACKEND_DEPLOY_ENABLED == 'true'");
    expect(workflow).not.toContain('db push');
    expect(workflow).not.toMatch(/^\s*(push|schedule):/m);
    expect(workflow).toContain('--project-ref ytvztfvypiwgnslisxep');
    expect(workflow).not.toContain('SUPABASE_DB_PASSWORD');
  });
  it('retains handler authentication, authorization, leases and preflight', () => {
    const handler = read('supabase/functions/swift-price-sync/index.ts');
    expect(handler).toContain("req.method === 'OPTIONS'");
    expect(handler).toContain("rpc('is_admin')");
    expect(handler).toContain('heartbeat_swift_price_sync');
    expect(handler).toContain('finish_swift_price_sync');
    expect(read('supabase/config.toml')).toContain('verify_jwt = false');
  });
});
