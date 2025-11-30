Param(
  [string]$NamespaceARC = "actions-runner-system"
)

Write-Host "Adding Helm repos..."
helm repo add jetstack https://charts.jetstack.io | Out-Null
helm repo add hashicorp https://helm.releases.hashicorp.com | Out-Null
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts | Out-Null
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller | Out-Null
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts | Out-Null
helm repo update | Out-Null

Write-Host "Installing cert-manager CRDs..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.crds.yaml | Out-Null

Write-Host "Installing cert-manager..."
helm upgrade --install cert-manager jetstack/cert-manager `
  --namespace cert-manager --create-namespace `
  --set installCRDs=false | Out-Null

Write-Host "Installing Vault..."
helm upgrade --install vault hashicorp/vault `
  --namespace vault --create-namespace `
  --values k8s/values/vault-values.yaml | Out-Null

Write-Host "Installing kube-prometheus-stack..."
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack `
  --namespace monitoring --create-namespace `
  --values k8s/values/monitoring-values.yaml | Out-Null

Write-Host "Installing Actions Runner Controller..."
kubectl create namespace $NamespaceARC --dry-run=client -o yaml | kubectl apply -f - | Out-Null
helm upgrade --install actions-runner-controller actions-runner-controller/actions-runner-controller `
  --namespace $NamespaceARC `
  --values k8s/values/arc-values.yaml | Out-Null

Write-Host "Installing Gatekeeper..."
helm upgrade --install gatekeeper gatekeeper/gatekeeper `
  --namespace gatekeeper-system --create-namespace `
  --values k8s/values/gatekeeper-values.yaml | Out-Null

Write-Host "Bootstrap complete. Configure Vault Kubernetes auth and ARC secrets next."
