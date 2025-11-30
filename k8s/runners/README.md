# Actions Runner Controller (ARC)

## Installation

```bash
kubectl apply -f https://github.com/actions/actions-runner-controller/releases/latest/download/actions-runner-controller.yaml
```

Or via Helm:
```bash
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm upgrade --install actions-runner-controller \
  actions-runner-controller/actions-runner-controller \
  -n actions-runner-system \
  --create-namespace
```

## Configuration

### 1. Create GitHub App Secret
```bash
kubectl create secret generic arc-github-app-secret \
  -n actions-runner-system \
  --from-literal=github_app_id=<id> \
  --from-literal=github_app_installation_id=<installation> \
  --from-literal=github_app_private_key=<pem_contents>
```

### 2. Deploy Runners
```bash
kubectl apply -f arc-runner-deployment.yaml
```

### 3. Verify
```bash
kubectl -n actions-runner-system get runners
kubectl -n actions-runner-system get pods
```

## Scaling

- Auto-scale based on webhook events (requires webhook server)
- Manual scaling: `kubectl -n actions-runner-system scale runnerdeployment foundation-runners --replicas=5`

## Security

- Use non-root runner images
- Limit CPU/memory resources
- Network policies to restrict egress
- Scan runner images with Trivy
- Rotate credentials regularly

## Troubleshooting

### Runners not appearing in GitHub
- Check secret: `kubectl -n actions-runner-system get secret arc-github-app-secret -o yaml`
- Check logs: `kubectl -n actions-runner-system logs -l app.kubernetes.io/name=actions-runner-controller`
- Verify GitHub App installation ID and permissions

### Pods crashing
- Check image pull policy and registry access
- Verify resource limits
- Review pod logs: `kubectl -n actions-runner-system logs <pod>`
