package kubernetes.admission

violation[{
  "msg": msg,
  "details": {"required_label": required}
}] {
  input.review.kind.kind == "Deployment"
  required := "app"
  not input.review.object.metadata.labels[required]
  msg := sprintf("Deployment must have label '%s'", [required])
}
