import { CabinetExplorer } from "@/components/cabinet-explorer"

export const metadata = {
  title: "Cabinet Explorer | Network Management",
  description: "Hierarchical OLT container explorer with rack, shelf, slot, and port management",
}

export default function CabinetExplorerPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cabinet Explorer</h1>
          <p className="text-muted-foreground">
            Navigate through the OLT container hierarchy. Click to expand Racks, Shelves, Slots, and Cards to view their internal components and port details.
          </p>
        </div>

        <CabinetExplorer />
      </div>
    </main>
  )
}
