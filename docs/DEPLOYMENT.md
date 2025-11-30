# Production Deployment Guide

## Prerequisites

- Kubernetes cluster (kind, EKS, AKS, GKE)
- kubectl, Helm 3
- GitHub App created and installed on your org/repos
- Vault or equivalent secret store (optional but recommended)

## 1. Install Core Infrastructure

### Cert-manager, Vault, Prometheus, ARC, Gatekeeper

```powershell
cd k8s
./bootstrap.ps1
```

Or on Linux/macOS:
```bash
cd k8s
./bootstrap.sh
```

## 2. Configure Secrets

### GitHub App Credentials

Option A: Manual Secret (dev/test only)
```bash
kubectl create secret generic github-app-credentials \
  -n control-plane \
  --from-literal=GITHUB_APP_ID=<your_app_id> \
  --from-literal=GITHUB_APP_INSTALLATION_ID=<your_installation_id> \
  --from-literal=GITHUB_APP_PRIVATE_KEY_BASE64=<base64_encoded_key>
```

Option B: Vault (recommended)
```bash
# Store in Vault
vault kv put secret/github-app \
  app_id=<id> \
  installation_id=<installation> \
  private_key_base64=<key>

# Apply SecretProviderClass (uncomment in k8s/secrets/github-app-secret.yaml)
kubectl apply -f k8s/secrets/github-app-secret.yaml
```

### ARC Runner Credentials

```bash
kubectl create secret generic arc-github-app-secret \
  -n actions-runner-system \
  --from-literal=github_app_id=<id> \
  --from-literal=github_app_installation_id=<installation> \
  --from-literal=github_app_private_key=<key>
```

## 3. Deploy Control Plane

### Local/Dev
```powershell
cd control-plane
./start-dev.ps1
```

### Cluster
```powershell
cd k8s
./deploy-local.ps1
```

Or manually:
```bash
kubectl create ns control-plane
helm upgrade --install control-plane ./helm/control-plane \
  -n control-plane \
  -f ./helm/control-plane/values.production.yaml
```

Verify:
```bash
kubectl -n control-plane get pods
kubectl -n control-plane port-forward deploy/control-plane 8080:8080
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/metrics
```

## 4. Deploy Self-Hosted Runners

```bash
kubectl apply -f k8s/runners/arc-runner-deployment.yaml
kubectl -n actions-runner-system get runners
```

## 5. Enable Autonomous Workflows

Workflows are in `.github/workflows/`:
- `autonomous-sync.yml` — runs every 6 hours, syncs changes to target repos
- `deploy-control-plane.yml` — builds and deploys control plane on push
- `policy-check.yml` — validates OPA/Gatekeeper policies on PR
- `codeql.yml` — security scanning
- `trivy.yml` — vulnerability scanning

### Required Secrets (GitHub org/repo settings)
- `KUBECONFIG` — base64-encoded kubeconfig for cluster access (if auto-deploying)
- `GITHUB_TOKEN` — automatically provided by GitHub Actions

## 6. Observability

### Prometheus + Grafana
```bash
kubectl -n monitoring get svc
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
# Default login: admin / prom-operator
```

Add dashboards for:
- Control plane metrics (`/metrics` endpoint)
- ARC runner health
- Gatekeeper audit violations

## 7. Policy Enforcement

Apply Gatekeeper constraints:
```bash
kubectl apply -f policies/opa/constraint-require-label.yaml
```

Verify:
```bash
kubectl get constraints
kubectl describe k8srequiredlabels require-app-label
```

## 8. Validation Checklist

- [ ] Control plane pods Running
- [ ] ServiceMonitor scraping metrics
- [ ] ARC runners registered and idle
- [ ] GitHub App installed and receiving webhooks
- [ ] CI workflows passing (CodeQL, Trivy, policy checks)
- [ ] Vault secrets accessible in cluster
- [ ] Gatekeeper enforcing constraints
- [ ] Grafana dashboards showing metrics

## Troubleshooting

### Control plane won't start
- Check secrets: `kubectl -n control-plane get secret github-app-credentials -o yaml`
- Check logs: `kubectl -n control-plane logs deploy/control-plane`

### Runners not registering
- Verify secret: `kubectl -n actions-runner-system get secret arc-github-app-secret -o yaml`
- Check ARC logs: `kubectl -n actions-runner-system logs -l app.kubernetes.io/name=actions-runner-controller`

### Metrics not scraped
- Verify ServiceMonitor: `kubectl -n control-plane get servicemonitor`
- Check Prometheus targets: Port-forward Prometheus and visit `/targets`

## Next Steps

- Configure Ingress for external access
- Set up alerting (AlertManager)
- Expand Gatekeeper policies
- Add E2E tests in CI
- Enable GitHub App webhook endpoints in control plane
