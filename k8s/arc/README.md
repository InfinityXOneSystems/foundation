# Actions Runner Controller (ARC) Onboarding

- Namespace: `actions-runner-system`
- Secrets required:
  - `github-app-id`
  - `github-app-private-key` (PEM)

Create secrets (example placeholders; integrate Vault/CSI for production):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: arc-github-app
  namespace: actions-runner-system
type: Opaque
stringData:
  app_id: "VAULT:secret/data/github#app_id"
  installation_id: "VAULT:secret/data/github#installation_id"
  private_key: "VAULT:secret/data/github#private_key_pem"
```

Configure ARC values to reference the secret and enable autoscaling.
```yaml
# k8s/values/arc-values.yaml
authSecret:
  enabled: true
  create: false
```

Harden runner pods: non-root user/group, limited egress, minimal capabilities.