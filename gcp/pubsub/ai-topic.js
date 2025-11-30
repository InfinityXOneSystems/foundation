// gcp/pubsub/ai-topic.js
// GCP Pub/Sub topic handler for agent events
exports.subscribeAI = (message) => {
  // TODO: Parse message, route to orchestrator or agent
  const data = Buffer.from(message.data, "base64").toString();
  console.log("Received AI event:", data);
};
