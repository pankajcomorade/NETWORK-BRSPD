// ==========================================
// FTTH Network Data Model
// ==========================================

export type DeviceStatus = "active" | "inactive" | "warning" | "maintenance"

export interface Port {
  id: string
  name: string
  status: DeviceStatus
  connectedTo?: string
  type: "feeder" | "distribution" | "drop" | "pon" | "ethernet" | "voice"
  strand?: number
}

export interface NetworkCard {
  id: string
  name: string
  type: string
  ports: Port[]
  status: DeviceStatus
}

export interface Slot {
  id: string
  name: string
  card?: NetworkCard
  status: DeviceStatus
}

export interface Shelf {
  id: string
  name: string
  slots: Slot[]
  status: DeviceStatus
}

export interface Rack {
  id: string
  name: string
  shelves: Shelf[]
  status: DeviceStatus
}

export interface OLT {
  id: string
  name: string
  distinguishedName: string
  commonName: string
  specification: string
  status: DeviceStatus
  networkStatus: string
  createdBy: string
  createDate: string
  lastUpdatedBy: string
  lastUpdatedDate: string
  racks: Rack[]
  feederCables: FeederCable[]
}

export interface FeederCable {
  id: string
  name: string
  strandCount: number
  sourceOltId: string
  sourcePortId: string
  destinationFdhId: string
  destinationPortId: string
  status: DeviceStatus
}

export interface Splitter {
  id: string
  name: string
  ratio: string // e.g. "1:32"
  inputPortId: string
  outputPorts: Port[]
  status: DeviceStatus
}

export interface FDH {
  id: string
  name: string
  location: string
  feederPorts: Port[]
  distributionPorts: Port[]
  splitters: Splitter[]
  status: DeviceStatus
  totalPorts: number
}

export interface DistributionCable {
  id: string
  name: string
  strandCount: number
  sourceFdhId: string
  sourcePortIds: string[]
  dropTerminals: DropTerminal[]
  status: DeviceStatus
}

export interface DropTerminal {
  id: string
  name: string
  location: string
  portCount: number
  ports: Port[]
  distributionCableId: string
  status: DeviceStatus
}

export interface ONT {
  id: string
  name: string
  model: string
  serialNumber: string
  address: string
  dropTerminalId: string
  dropTerminalPortId: string
  status: DeviceStatus
  isMDU: boolean
  customerName?: string
  serviceStatus: "working" | "pending" | "disconnected"
  voicePorts: number
  ethernetPorts: number
}

// ==========================================
// Navigation / Breadcrumb Types
// ==========================================

export type NodeType =
  | "overview"
  | "olt"
  | "rack"
  | "shelf"
  | "slot"
  | "card"
  | "port"
  | "feeder-cable"
  | "fdh"
  | "splitter"
  | "distribution-cable"
  | "drop-terminal"
  | "ont"

export interface BreadcrumbItem {
  label: string
  nodeType: NodeType
  nodeId: string
}

// ==========================================
// Sample Network Data
// ==========================================

const createPorts = (
  prefix: string,
  count: number,
  type: Port["type"],
  statuses?: DeviceStatus[]
): Port[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, "0")}`,
    name: `PP=${String(i + 1).padStart(3, "0")}`,
    status: statuses ? statuses[i % statuses.length] : (i < count * 0.7 ? "active" : "inactive") as DeviceStatus,
    type,
    strand: i + 1,
  }))

export const sampleOLTs: OLT[] = [
  {
    id: "olt-1",
    name: "BUFTNCXAH07",
    distinguishedName: "ME=BUFTNCXAH07",
    commonName: "BUFTNCXAH07",
    specification: "Calix E7-20 OLT",
    status: "active",
    networkStatus: "In Service",
    createdBy: "QUANTUMCNV",
    createDate: "16/06/2021",
    lastUpdatedBy: "QUANTUMCNV",
    lastUpdatedDate: "12/07/2025",
    racks: [
      {
        id: "rk-001",
        name: "RK=001",
        status: "active",
        shelves: [
          {
            id: "sf-001",
            name: "SF=001",
            status: "active",
            slots: [
              {
                id: "sl-001",
                name: "SL=001",
                status: "active",
                card: {
                  id: "nc-001",
                  name: "NC=001",
                  type: "GPON Line Card",
                  status: "active",
                  ports: createPorts("pp-001", 8, "pon", ["active", "active", "active", "active", "active", "inactive", "inactive", "inactive"]),
                },
              },
              {
                id: "sl-002",
                name: "SL=002",
                status: "active",
                card: {
                  id: "nc-002",
                  name: "NC=002",
                  type: "GPON Line Card",
                  status: "active",
                  ports: createPorts("pp-002", 8, "pon", ["active", "active", "active", "inactive", "inactive", "inactive", "inactive", "inactive"]),
                },
              },
              {
                id: "sl-003",
                name: "SL=003",
                status: "active",
                card: {
                  id: "nc-003",
                  name: "NC=003",
                  type: "10G GPON Card",
                  status: "active",
                  ports: createPorts("pp-003", 4, "pon", ["active", "active", "inactive", "inactive"]),
                },
              },
              {
                id: "sl-004",
                name: "SL=004",
                status: "inactive",
              },
              {
                id: "sl-005",
                name: "SL=005",
                status: "inactive",
              },
            ],
          },
        ],
      },
    ],
    feederCables: [
      {
        id: "fc-001",
        name: "Feeder Cable A-07",
        strandCount: 48,
        sourceOltId: "olt-1",
        sourcePortId: "pp-001-001",
        destinationFdhId: "fdh-1",
        destinationPortId: "fp-001",
        status: "active",
      },
      {
        id: "fc-002",
        name: "Feeder Cable B-07",
        strandCount: 24,
        sourceOltId: "olt-1",
        sourcePortId: "pp-001-002",
        destinationFdhId: "fdh-2",
        destinationPortId: "fp-001",
        status: "active",
      },
    ],
  },
  {
    id: "olt-2",
    name: "FOLYALXAH42",
    distinguishedName: "ME=FOLYALXAH42",
    commonName: "FOLYALXAH42",
    specification: "Calix E7-2 OLT",
    status: "active",
    networkStatus: "In Service",
    createdBy: "QUANTUMCNV",
    createDate: "03/11/2020",
    lastUpdatedBy: "QUANTUMCNV",
    lastUpdatedDate: "01/15/2026",
    racks: [
      {
        id: "rk-002",
        name: "RK=001",
        status: "active",
        shelves: [
          {
            id: "sf-002",
            name: "SF=001",
            status: "active",
            slots: [
              {
                id: "sl-006",
                name: "SL=001",
                status: "active",
                card: {
                  id: "nc-004",
                  name: "NC=001",
                  type: "GPON Line Card",
                  status: "active",
                  ports: createPorts("pp-004", 8, "pon", ["active", "active", "active", "active", "inactive", "inactive", "inactive", "inactive"]),
                },
              },
              {
                id: "sl-007",
                name: "SL=002",
                status: "active",
                card: {
                  id: "nc-005",
                  name: "NC=002",
                  type: "GPON Line Card",
                  status: "active",
                  ports: createPorts("pp-005", 8, "pon", ["active", "active", "inactive", "inactive", "inactive", "inactive", "inactive", "inactive"]),
                },
              },
            ],
          },
        ],
      },
    ],
    feederCables: [
      {
        id: "fc-003",
        name: "Feeder Cable A-42",
        strandCount: 96,
        sourceOltId: "olt-2",
        sourcePortId: "pp-004-001",
        destinationFdhId: "fdh-1",
        destinationPortId: "fp-002",
        status: "active",
      },
    ],
  },
]

export const sampleFDHs: FDH[] = [
  {
    id: "fdh-1",
    name: "FDH-MAIN-001",
    location: "123 Main St, Buffalo, NY",
    feederPorts: [
      { id: "fp-001", name: "FP=001", status: "active", type: "feeder", connectedTo: "Feeder Cable A-07 (BUFTNCXAH07)" },
      { id: "fp-002", name: "FP=002", status: "active", type: "feeder", connectedTo: "Feeder Cable A-42 (FOLYALXAH42)" },
      { id: "fp-003", name: "FP=003", status: "inactive", type: "feeder" },
      { id: "fp-004", name: "FP=004", status: "inactive", type: "feeder" },
    ],
    distributionPorts: createPorts("dp-001", 128, "distribution"),
    splitters: [
      {
        id: "spl-001",
        name: "SPL=001",
        ratio: "1:32",
        inputPortId: "fp-001",
        outputPorts: createPorts("spl-001-out", 32, "distribution"),
        status: "active",
      },
      {
        id: "spl-002",
        name: "SPL=002",
        ratio: "1:32",
        inputPortId: "fp-001",
        outputPorts: createPorts("spl-002-out", 32, "distribution"),
        status: "active",
      },
      {
        id: "spl-003",
        name: "SPL=003",
        ratio: "1:32",
        inputPortId: "fp-002",
        outputPorts: createPorts("spl-003-out", 32, "distribution"),
        status: "active",
      },
      {
        id: "spl-004",
        name: "SPL=004",
        ratio: "1:32",
        inputPortId: "fp-002",
        outputPorts: createPorts("spl-004-out", 32, "distribution"),
        status: "active",
      },
    ],
    status: "active",
    totalPorts: 144,
  },
  {
    id: "fdh-2",
    name: "FDH-ELM-002",
    location: "456 Elm Ave, Buffalo, NY",
    feederPorts: [
      { id: "fp-005", name: "FP=001", status: "active", type: "feeder", connectedTo: "Feeder Cable B-07 (BUFTNCXAH07)" },
      { id: "fp-006", name: "FP=002", status: "inactive", type: "feeder" },
    ],
    distributionPorts: createPorts("dp-002", 64, "distribution"),
    splitters: [
      {
        id: "spl-005",
        name: "SPL=001",
        ratio: "1:32",
        inputPortId: "fp-005",
        outputPorts: createPorts("spl-005-out", 32, "distribution"),
        status: "active",
      },
      {
        id: "spl-006",
        name: "SPL=006",
        ratio: "1:32",
        inputPortId: "fp-005",
        outputPorts: createPorts("spl-006-out", 32, "distribution"),
        status: "active",
      },
    ],
    status: "active",
    totalPorts: 72,
  },
]

export const sampleDistributionCables: DistributionCable[] = [
  {
    id: "dc-001",
    name: "Dist Cable 001 - Main St",
    strandCount: 128,
    sourceFdhId: "fdh-1",
    sourcePortIds: ["dp-001-001", "dp-001-002"],
    status: "active",
    dropTerminals: [],
  },
  {
    id: "dc-002",
    name: "Dist Cable 002 - Oak Rd",
    strandCount: 64,
    sourceFdhId: "fdh-1",
    sourcePortIds: ["dp-001-003"],
    status: "active",
    dropTerminals: [],
  },
  {
    id: "dc-003",
    name: "Dist Cable 003 - Elm Ave",
    strandCount: 64,
    sourceFdhId: "fdh-2",
    sourcePortIds: ["dp-002-001"],
    status: "active",
    dropTerminals: [],
  },
]

export const sampleDropTerminals: DropTerminal[] = [
  {
    id: "dt-001",
    name: "DT-MAIN-001",
    location: "100 Main St",
    portCount: 8,
    ports: createPorts("dt-001-p", 8, "drop", ["active", "active", "active", "active", "active", "inactive", "inactive", "inactive"]),
    distributionCableId: "dc-001",
    status: "active",
  },
  {
    id: "dt-002",
    name: "DT-MAIN-002",
    location: "200 Main St",
    portCount: 8,
    ports: createPorts("dt-002-p", 8, "drop", ["active", "active", "active", "inactive", "inactive", "inactive", "inactive", "inactive"]),
    distributionCableId: "dc-001",
    status: "active",
  },
  {
    id: "dt-003",
    name: "DT-OAK-001",
    location: "50 Oak Rd",
    portCount: 4,
    ports: createPorts("dt-003-p", 4, "drop", ["active", "active", "inactive", "inactive"]),
    distributionCableId: "dc-002",
    status: "active",
  },
  {
    id: "dt-004",
    name: "DT-OAK-002",
    location: "75 Oak Rd",
    portCount: 12,
    ports: createPorts("dt-004-p", 12, "drop", ["active", "active", "active", "active", "active", "active", "inactive", "inactive", "inactive", "inactive", "inactive", "inactive"]),
    distributionCableId: "dc-002",
    status: "active",
  },
  {
    id: "dt-005",
    name: "DT-ELM-001",
    location: "456 Elm Ave",
    portCount: 8,
    ports: createPorts("dt-005-p", 8, "drop", ["active", "active", "active", "active", "inactive", "inactive", "inactive", "inactive"]),
    distributionCableId: "dc-003",
    status: "active",
  },
  {
    id: "dt-006",
    name: "DT-ELM-002",
    location: "500 Elm Ave (MDU)",
    portCount: 16,
    ports: createPorts("dt-006-p", 16, "drop", ["active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "inactive", "inactive", "inactive", "inactive", "inactive", "inactive"]),
    distributionCableId: "dc-003",
    status: "active",
  },
]

// Link distribution cables to drop terminals
sampleDistributionCables[0].dropTerminals = [sampleDropTerminals[0], sampleDropTerminals[1]]
sampleDistributionCables[1].dropTerminals = [sampleDropTerminals[2], sampleDropTerminals[3]]
sampleDistributionCables[2].dropTerminals = [sampleDropTerminals[4], sampleDropTerminals[5]]

export const sampleONTs: ONT[] = [
  {
    id: "ont-001",
    name: "ONT-100MAIN-1",
    model: "Calix 844G-1",
    serialNumber: "CXNK00A1B2C3",
    address: "100 Main St, Apt 1",
    dropTerminalId: "dt-001",
    dropTerminalPortId: "dt-001-p-001",
    status: "active",
    isMDU: false,
    customerName: "John Smith",
    serviceStatus: "working",
    voicePorts: 2,
    ethernetPorts: 4,
  },
  {
    id: "ont-002",
    name: "ONT-100MAIN-2",
    model: "Calix 844G-1",
    serialNumber: "CXNK00D4E5F6",
    address: "102 Main St",
    dropTerminalId: "dt-001",
    dropTerminalPortId: "dt-001-p-002",
    status: "active",
    isMDU: false,
    customerName: "Jane Doe",
    serviceStatus: "working",
    voicePorts: 2,
    ethernetPorts: 4,
  },
  {
    id: "ont-003",
    name: "ONT-200MAIN-1",
    model: "Calix 844E-1",
    serialNumber: "CXNK00G7H8I9",
    address: "200 Main St",
    dropTerminalId: "dt-002",
    dropTerminalPortId: "dt-002-p-001",
    status: "active",
    isMDU: false,
    customerName: "Bob Wilson",
    serviceStatus: "working",
    voicePorts: 8,
    ethernetPorts: 2,
  },
  {
    id: "ont-004",
    name: "ONT-50OAK-1",
    model: "Calix 804Mesh",
    serialNumber: "CXNK00J1K2L3",
    address: "50 Oak Rd",
    dropTerminalId: "dt-003",
    dropTerminalPortId: "dt-003-p-001",
    status: "active",
    isMDU: false,
    customerName: "Alice Brown",
    serviceStatus: "pending",
    voicePorts: 0,
    ethernetPorts: 2,
  },
  {
    id: "ont-005",
    name: "ONT-500ELM-MDU",
    model: "Calix P-Series MDU",
    serialNumber: "CXNK00M4N5O6",
    address: "500 Elm Ave (MDU Building)",
    dropTerminalId: "dt-006",
    dropTerminalPortId: "dt-006-p-001",
    status: "active",
    isMDU: true,
    customerName: "Elm Apartments - Shared",
    serviceStatus: "working",
    voicePorts: 24,
    ethernetPorts: 24,
  },
  {
    id: "ont-006",
    name: "ONT-456ELM-1",
    model: "Calix 844G-1",
    serialNumber: "CXNK00P7Q8R9",
    address: "456 Elm Ave, Unit A",
    dropTerminalId: "dt-005",
    dropTerminalPortId: "dt-005-p-001",
    status: "active",
    isMDU: false,
    customerName: "Charlie Davis",
    serviceStatus: "working",
    voicePorts: 2,
    ethernetPorts: 4,
  },
]
