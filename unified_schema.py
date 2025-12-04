"""
Unified Action Schema (UAS) - Core Protocol for Intelligence-to-Code Pipeline
Defines the mandatory I/O format for all AI → Copilot → Cloud communication.
Version: 1.0.0
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import json


class TaskStatus(Enum):
    """Lifecycle states for all UAS tasks."""
    PENDING = "pending"
    PLANNING = "planning"
    EXECUTING = "executing"
    VALIDATING = "validating"
    DEPLOYED = "deployed"
    HEALED = "healed"
    FAILED = "failed"


class Priority(Enum):
    """Task priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class UASMetadata:
    """Metadata envelope for all UAS messages."""
    task_id: str
    timestamp: str
    version: str = "1.0.0"
    orchestrator: str = "gemini"
    executor: str = "copilot"
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UASContext:
    """Execution context and constraints."""
    repository: str
    branch: str = "main"
    target_env: str = "development"
    constraints: Optional[Dict[str, Any]] = None
    dependencies: Optional[List[str]] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UASPayload:
    """Core task specification."""
    sgp: str  # Semantic Goal Prompt
    objective: str
    description: str
    acceptance_criteria: List[str]
    estimated_tokens: Optional[int] = None
    required_skills: Optional[List[str]] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UASDeliverable:
    """Generated code/artifact specification."""
    file_path: str
    content: str
    file_type: str  # e.g., "python", "yaml", "json"
    checksum: Optional[str] = None
    dependencies: Optional[List[str]] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UASGovernance:
    """Security & governance validation results."""
    security_check: bool
    schema_validation: bool
    compliance_rules: Dict[str, bool]
    governance_signature: Optional[str] = None
    approved_by: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UASExecution:
    """Deployment and execution tracking."""
    deployment_target: str
    deployment_method: str  # e.g., "railway", "aws", "k8s"
    status: TaskStatus
    logs: Optional[List[str]] = None
    error_message: Optional[str] = None
    deployed_at: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UASMessage:
    """Complete Unified Action Schema message."""
    metadata: UASMetadata
    context: UASContext
    payload: UASPayload
    deliverables: List[UASDeliverable]
    governance: UASGovernance
    execution: UASExecution
    
    def to_json(self) -> str:
        """Serialize to JSON."""
        return json.dumps({
            "metadata": self.metadata.to_dict(),
            "context": self.context.to_dict(),
            "payload": self.payload.to_dict(),
            "deliverables": [d.to_dict() for d in self.deliverables],
            "governance": self.governance.to_dict(),
            "execution": self.execution.to_dict(),
        }, indent=2, default=str)
    
    @classmethod
    def from_json(cls, json_str: str) -> "UASMessage":
        """Deserialize from JSON."""
        data = json.loads(json_str)
        return cls(
            metadata=UASMetadata(**data["metadata"]),
            context=UASContext(**data["context"]),
            payload=UASPayload(**data["payload"]),
            deliverables=[UASDeliverable(**d) for d in data["deliverables"]],
            governance=UASGovernance(**data["governance"]),
            execution=UASExecution(
                deployment_target=data["execution"]["deployment_target"],
                deployment_method=data["execution"]["deployment_method"],
                status=TaskStatus(data["execution"]["status"]),
                logs=data["execution"].get("logs"),
                error_message=data["execution"].get("error_message"),
                deployed_at=data["execution"].get("deployed_at"),
            ),
        )
    
    def validate(self) -> bool:
        """Basic schema validation."""
        return all([
            self.metadata,
            self.context,
            self.payload,
            self.governance,
            self.execution,
        ])


def create_uas_task(
    task_id: str,
    sgp: str,
    objective: str,
    repository: str,
    acceptance_criteria: List[str],
    deployment_target: str = "railway",
) -> UASMessage:
    """Factory function to create a new UAS task."""
    return UASMessage(
        metadata=UASMetadata(
            task_id=task_id,
            timestamp=datetime.now().isoformat(),
        ),
        context=UASContext(
            repository=repository,
            target_env="development",
        ),
        payload=UASPayload(
            sgp=sgp,
            objective=objective,
            description=f"Task: {objective}",
            acceptance_criteria=acceptance_criteria,
        ),
        deliverables=[],
        governance=UASGovernance(
            security_check=False,
            schema_validation=False,
            compliance_rules={},
        ),
        execution=UASExecution(
            deployment_target=deployment_target,
            deployment_method="railway",
            status=TaskStatus.PENDING,
        ),
    )


if __name__ == "__main__":
    # Example usage
    task = create_uas_task(
        task_id="hello-world-001",
        sgp="Build a simple Hello World API endpoint",
        objective="Create GET /hello endpoint returning JSON",
        repository="gateway",
        acceptance_criteria=[
            "Endpoint responds with HTTP 200",
            "Response contains message field",
            "Code passes security checks",
        ],
    )
    print(task.to_json())
