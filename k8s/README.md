# Local Deployment

## One-command deploy + verify

```powershell
cd "C:\Users\Neoge\Documents\InfinityXOneSystems\foundation\k8s"
./deploy-local.ps1
```

## Expose without port-forward (optional)

Switch service type to `NodePort` and pick `nodePort`:

```powershell
helm upgrade --install control-plane ../helm/control-plane \
  -n control-plane \
  -f ../helm/control-plane/values.production.yaml \
  --set service.type=NodePort --set service.nodePort=30080

kubectl -n control-plane get svc control-plane
# Access: http://127.0.0.1:30080/healthz
```

Ensure an ingress controller if using Ingress.
