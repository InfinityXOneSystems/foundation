# Secrets Management

## Overview

All secrets must be stored securely. **Never commit real secrets to git.**

## Options

### 1. Kubernetes Secrets (dev/test only)
```bash
kubectl create secret generic github-app-credentials \
  -n control-plane \
  --from-literal=GITHUB_APP_ID=123456 \
  --from-literal=GITHUB_APP_INSTALLATION_ID=7891011 \
  --from-literal=GITHUB_APP_PRIVATE_KEY_BASE64=<base64_key>
```

### 2. HashiCorp Vault (recommended)
- Store secrets in Vault: `vault kv put secret/github-app app_id=... installation_id=... private_key_base64=...`
- Use Vault CSI Driver or External Secrets Operator to inject into pods
- Uncomment SecretProviderClass in `github-app-secret.yaml`

### 3. External Secrets Operator
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: github-app-credentials
  namespace: control-plane
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: github-app-credentials
  data:
    - secretKey: GITHUB_APP_ID
      remoteRef:
        key: secret/github-app
        property: app_id
    - secretKey: GITHUB_APP_INSTALLATION_ID
      remoteRef:
        key: secret/github-app
        property: installation_id
    - secretKey: GITHUB_APP_PRIVATE_KEY_BASE64
      remoteRef:
        key: secret/github-app
        property: private_key_base64
```

### 4. Sealed Secrets
- Encrypt secrets client-side: `kubeseal < secret.yaml > sealed-secret.yaml`
- Commit sealed secrets; controller decrypts in-cluster

## Rotation

- Rotate secrets regularly (quarterly minimum)
- Update Vault/secret store
- Restart affected pods: `kubectl -n control-plane rollout restart deploy/control-plane`

## Audit

- Enable Kubernetes audit logging
- Track secret access in Vault audit logs
- Alert on unauthorized access attempts
