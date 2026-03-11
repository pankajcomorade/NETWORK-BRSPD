import { VisualHierarchyExplorer } from "@/components/visual-hierarchy-explorer"
import { sampleOLTs } from "@/lib/network-data"

export default function VisualExplorerPage() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Visual Hierarchy Explorer</h1>
        <p className="text-slate-400 mt-2">Explore your network infrastructure by drilling down through the container hierarchy</p>
      </div>
      <VisualHierarchyExplorer selectedOltId={sampleOLTs[0]?.id} />
    </div>
  )
}
