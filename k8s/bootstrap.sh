#!/usr/bin/env bash
set -euo pipefail

# Kubernetes bootstrap for cert-manager, Vault, prometheus-stack, actions-runner-controller, Gatekeeper

NAMESPACE_ARC="actions-runner-system"

helm repo add jetstack https://charts.jetstack.io
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm repo update

# cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.crds.yaml
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=false

# Vault
helm upgrade --install vault hashicorp/vault \
  --namespace vault --create-namespace \
  --values k8s/values/vault-values.yaml

# Prometheus stack
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --values k8s/values/monitoring-values.yaml

# Actions Runner Controller
kubectl create namespace ${NAMESPACE_ARC} --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install actions-runner-controller actions-runner-controller/actions-runner-controller \
  --namespace ${NAMESPACE_ARC} \
  --values k8s/values/arc-values.yaml

# Gatekeeper
helm upgrade --install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system --create-namespace \
  --values k8s/values/gatekeeper-values.yaml

echo "Bootstrap complete. Configure Vault Kubernetes auth and ARC secrets next."
