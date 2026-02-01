export function logAudit(action: string, resource: string, details: any, ip: string) {
    // Structured logging for Vercel/CloudWatch/etc.
    // Filter by "event": "AUDIT_LOG" in your dashboards.
    console.log(JSON.stringify({
        event: "AUDIT_LOG",
        timestamp: new Date().toISOString(),
        action: action.toUpperCase(),
        resource: resource.toUpperCase(),
        details: details,
        ip_address: ip
    }));
}
