export const CURRENT_FLOW_DEFINITION = `flowchart TD
    A["Packet arrives<br/><small>14-page fax or portal submission</small>"]
    B["Nurse reads manually<br/><small>All 14 pages, hunting for facts</small>"]
    C["Cross-references criteria<br/><small>NCD, LCD, policy, MCG — by hand</small>"]
    D{"All criteria clearly documented?"}
    E["Nurse approves<br/><small>Clear-cut case</small>"]
    F["Case pended<br/><small>Fact missing or ambiguous</small>"]
    G["Fax traded with provider<br/><small>Multiple rounds to resolve</small>"]
    H["Admission date at risk<br/><small>While this resolves</small>"]

    A --> B --> C --> D
    D -->|Yes| E
    D -->|No / ambiguous| F --> G --> H

    classDef gray fill:#F1EFE8,stroke:#888780,color:#2C2C2A
    classDef amber fill:#FAEEDA,stroke:#BA7517,color:#412402
    classDef coral fill:#FAECE7,stroke:#D85A30,color:#4A1B0C
    classDef teal fill:#E1F5EE,stroke:#1D9E75,color:#04342C

    class A,B,C gray
    class D amber
    class F,G,H coral
    class E teal`

export const FUTURE_FLOW_DEFINITION = `flowchart TD
    S0["Landing"] --> S1["Case Queue<br/><small>4 cases</small>"]

    S1 --> QA["Clean Approval"]
    S1 --> QB["John Doe"]
    S1 --> QC["Multi-Ambiguous"]
    S1 --> QD["Corrupted Packet"]

    QA --> EA["Extraction"]
    QB --> EB["Extraction"]
    QC --> EC["Extraction"]
    QD --> F9["Failure State<br/><small>Can't parse — routed to manual review</small>"]

    EA --> CA["Checklist<br/><small>ALL MET — Lighter review badge</small>"]
    EB --> CB["Checklist<br/><small>1 AMBIGUOUS — Standard review</small>"]
    EC --> CC["Checklist<br/><small>2 AMBIGUOUS — Escalation required</small>"]

    CB --> ADB["Ambiguity Detail"]
    CC --> ADC["Ambiguity Detail"]

    ADB --> APB["Action Panel"]
    ADC --> APC["Action Panel<br/><small>Auto-suggests Escalate</small>"]

    APB --> CL6["Clarification Sent"]
    CL6 --> CL6B["Provider Responds<br/><small>Re-checks ONLY that criterion</small>"]

    APB -.-> ESC1["Escalate"]
    APC --> ESC2["Escalate"]

    ESC1 --> MDV1["MD View<br/><small>MD's own Action Panel</small>"]
    ESC2 --> MDV2["MD View<br/><small>MD's own Action Panel</small>"]

    MDV1 --> MDR1["MD Resolves"]
    MDV2 --> MDR2["MD Resolves"]

    CA --> DET["Determination<br/>+ Citation Trail"]
    CL6B --> DET
    MDR1 --> DET
    MDR2 --> DET

    classDef gray fill:#F1EFE8,stroke:#888780,color:#2C2C2A
    classDef purple fill:#EEEDFE,stroke:#7F77DD,color:#26215C
    classDef amber fill:#FAEEDA,stroke:#BA7517,color:#412402
    classDef teal fill:#E1F5EE,stroke:#1D9E75,color:#04342C
    classDef blue fill:#E6F1FB,stroke:#378ADD,color:#042C53
    classDef coral fill:#FAECE7,stroke:#D85A30,color:#4A1B0C

    class S0,S1,QA,QB,QC,QD gray
    class EA,EB,EC purple
    class CA,CB,CC,ADB,ADC amber
    class APB,APC,CL6,CL6B teal
    class ESC1,ESC2,MDV1,MDV2,MDR1,MDR2 blue
    class F9 coral
    class DET teal`
